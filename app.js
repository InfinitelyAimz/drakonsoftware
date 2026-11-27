const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
menuButton.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!expanded));
  navigation.classList.toggle('open', !expanded);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  navigation.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
}));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigation.classList.contains('open')) {
    navigation.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.focus();
  }
});
const form = document.querySelector('#quote');
const submitButton = form.querySelector('button[type=submit]');
const emailEndpoint = form.dataset.emailEndpoint || '';
const emailReady = /^https:\/\/formspree\.io\/f\/[a-z0-9]+$/i.test(emailEndpoint);
if (emailReady) {
  submitButton.textContent = 'Send email request';
  form.querySelector('.form-note').textContent = 'Email sends your request directly through Formspree. WhatsApp opens a message for you to review and send. Please don’t include passwords or sensitive information.';
}
document.querySelectorAll('[data-service]').forEach(link => link.addEventListener('click', () => {
  form.elements.service.value = link.dataset.service;
}));
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submitButton.disabled || !form.reportValidity()) return;
  const data = new FormData(form);
  if (data.get('_gotcha')) return;
  const status = form.querySelector('.form-status');
  status.classList.remove('error');
  const channel = event.submitter?.value || 'email';
  const message = [
    'Hello Drakon, I would like to discuss a quote.', '',
    'Name: ' + data.get('name').trim(),
    'Email: ' + data.get('email').trim(),
    ...(data.get('phone').trim() ? ['Phone: ' + data.get('phone').trim()] : []),
    'Service: ' + data.get('service'), '', data.get('details').trim()
  ].join('\n');
  if (channel === 'email' && emailReady) {
    submitButton.disabled = true;
    submitButton.textContent = 'Sending your request…';
    form.setAttribute('aria-busy', 'true');
    status.textContent = 'Sending your enquiry. Please keep this page open.';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(emailEndpoint, {
        method: 'POST', headers: {'Content-Type':'application/json','Accept':'application/json'},
        signal: controller.signal,
        body: JSON.stringify({name:data.get('name').trim(), email:data.get('email').trim(), phone:data.get('phone').trim() || 'Not supplied', service:data.get('service'), message:data.get('details').trim(), subject:'Drakon quote enquiry: ' + data.get('service'), _gotcha:''})
      });
      const result = await response.json();
      if (!response.ok || result.ok === false || result.errors) throw new Error('Email service rejected the enquiry');
      status.textContent = 'Your request has been submitted. Thank you — Drakon will contact you using the details you provided.';
      form.reset();
    } catch (error) {
      status.classList.add('error');
      status.textContent = 'We couldn’t confirm your request was sent. Your details are still here. Please try WhatsApp or email us directly.';
    } finally {
      clearTimeout(timeout);
      form.removeAttribute('aria-busy');
      submitButton.disabled = false;
      submitButton.textContent = 'Send email request';
    }
    return;
  }
  const isEmail = channel === 'email';
  const destination = isEmail
    ? 'mailto:drakonsoftwaresolutions@gmail.com?subject=' + encodeURIComponent('Drakon quote enquiry: ' + data.get('service')) + '&body=' + encodeURIComponent(message)
    : 'https://wa.me/27725243008?text=' + encodeURIComponent(message);
  status.replaceChildren(document.createTextNode(isEmail
    ? 'Review and send the prepared message in your email app. If it didn’t open, '
    : 'Review and send your message in WhatsApp. If it didn’t open, '));
  const retry = document.createElement('a');
  retry.href = destination;
  retry.textContent = isEmail ? 'open your email draft' : 'open your WhatsApp enquiry';
  if (!isEmail) { retry.target = '_blank'; retry.rel = 'noopener noreferrer'; }
  retry.style.textDecoration = 'underline';
  status.append(retry, document.createTextNode(isEmail
    ? ' or email drakonsoftwaresolutions@gmail.com directly. Your enquiry has not been sent automatically.'
    : '. Your enquiry has not been sent automatically.'));
  if (isEmail) window.location.href = destination;
  else window.open(destination, '_blank', 'noopener,noreferrer');
});

document.querySelector('#year').textContent = new Date().getFullYear();

// Size the continuous service links to the strip at a steady reading speed.
const servicesTicker = document.querySelector('.services-ticker');
if (servicesTicker) {
  const sizeTicker = () => {
    const width = servicesTicker.clientWidth;
    const minimum = window.innerWidth <= 700 ? 600 : 650;
    servicesTicker.style.setProperty('--ticker-width', `${width}px`);
    servicesTicker.style.setProperty('--ticker-duration', `${Math.max(width, minimum) / 32}s`);
  };
  new ResizeObserver(sizeTicker).observe(servicesTicker);
  sizeTicker();
}
