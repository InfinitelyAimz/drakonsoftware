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
const emailOption = form.querySelector('[value=email]');
emailOption.disabled = !emailReady;
emailOption.closest('label').hidden = !emailReady;
if (emailReady) {
  emailOption.checked = true;
  submitButton.textContent = 'Send email request';
  form.querySelector('.form-note').textContent = 'Choose Email to send your request directly from this website. Email enquiries are processed by Formspree and delivered to Drakon so we can respond. WhatsApp opens a message for you to review and send. Please don’t include passwords or sensitive information.';
}
document.querySelectorAll('[data-service]').forEach(link => link.addEventListener('click', () => {
  form.elements.service.value = link.dataset.service;
}));
form.querySelectorAll('[name=channel]').forEach(radio => radio.addEventListener('change', () => {
  submitButton.textContent = form.elements.channel.value === 'email' ? 'Send email request' : 'Continue to WhatsApp';
  form.querySelector('.form-status').textContent = '';
}));
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submitButton.disabled || !form.reportValidity()) return;
  const data = new FormData(form);
  if (data.get('_gotcha')) return;
  const status = form.querySelector('.form-status');
  status.classList.remove('error');
  const channel = data.get('channel');
  if (channel === 'email') {
    if (!emailReady) {
      status.textContent = 'Please contact us on WhatsApp or email drakonsoftwaresolutions@gmail.com while direct email delivery is being set up.';
      return;
    }
    submitButton.disabled = true;
    submitButton.textContent = 'Sending your request…';
    form.setAttribute('aria-busy', 'true');
    status.textContent = 'Sending your enquiry. Please keep this page open.';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(emailEndpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
        signal: controller.signal,
        body: JSON.stringify({
          name: data.get('name').trim(),
          email: data.get('email').trim(),
          phone: data.get('phone').trim() || 'Not supplied',
          service: data.get('service'),
          message: data.get('details').trim(),
          subject: 'Drakon quote enquiry: ' + data.get('service'),
          _gotcha: ''
        })
      });
      const result = await response.json();
      if (!response.ok || result.ok === false || result.errors) {
        throw new Error('Email service did not accept the enquiry');
      }
      status.textContent = 'Your request has been submitted. Thank you — Drakon will contact you using the details you provided.';
      form.reset();
      emailOption.checked = true;
    } catch (error) {
      status.classList.add('error');
      status.textContent = error.name === 'AbortError'
        ? 'We couldn’t confirm whether your request was sent. Please contact us on WhatsApp or call 072 524 3008. Your details are still here.'
        : 'Your request could not be confirmed. Please try again or contact us on WhatsApp or call 072 524 3008. Your details are still here.';
    } finally {
      clearTimeout(timeout);
      form.removeAttribute('aria-busy');
      submitButton.disabled = false;
      submitButton.textContent = form.elements.channel.value === 'email' ? 'Send email request' : 'Continue to WhatsApp';
    }
    return;
  }
  const message = [
    'Hello Drakon, I would like to discuss a quote.', '',
    `Name: ${data.get('name').trim()}`,
    `Email: ${data.get('email').trim()}`,
    ...(data.get('phone').trim() ? [`Phone: ${data.get('phone').trim()}`] : []),
    `Service: ${data.get('service')}`, '',
    data.get('details').trim()
  ].join('\n');
  const destination = `https://wa.me/27725243008?text=${encodeURIComponent(message)}`;
  window.open(destination, '_blank', 'noopener,noreferrer');
  status.replaceChildren(document.createTextNode('Review and send your message in WhatsApp. If it didn’t open, '));
  const retry = document.createElement('a');
  retry.href = destination;
  retry.textContent = 'open your enquiry here';
  retry.target = '_blank'; retry.rel = 'noopener noreferrer';
  retry.style.textDecoration = 'underline';
  status.append(retry, document.createTextNode('. Your enquiry has not been sent automatically.'));
});
document.querySelector('#year').textContent = new Date().getFullYear();
