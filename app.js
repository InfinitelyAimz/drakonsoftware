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
document.querySelectorAll('[data-service]').forEach(link => link.addEventListener('click', () => {
  form.elements.service.value = link.dataset.service;
}));
form.querySelectorAll('[name=channel]').forEach(radio => radio.addEventListener('change', () => {
  submitButton.textContent = form.elements.channel.value === 'email' ? 'Continue to email' : 'Continue to WhatsApp';
  form.querySelector('.form-status').textContent = '';
}));
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const message = [
    'Hello Drakon, I would like to discuss a quote.', '',
    `Name: ${data.get('name').trim()}`,
    `Email: ${data.get('email').trim()}`,
    ...(data.get('phone').trim() ? [`Phone: ${data.get('phone').trim()}`] : []),
    `Service: ${data.get('service')}`, '',
    data.get('details').trim()
  ].join('\n');
  const channel = data.get('channel');
  const destination = channel === 'email'
    ? `mailto:drakonsoftwaresolutions@gmail.com?subject=${encodeURIComponent('Quote enquiry: ' + data.get('service'))}&body=${encodeURIComponent(message)}`
    : `https://wa.me/27725243008?text=${encodeURIComponent(message)}`;
  if (channel === 'email') window.location.href = destination;
  else window.open(destination, '_blank', 'noopener,noreferrer');
  const status = form.querySelector('.form-status');
  status.replaceChildren(document.createTextNode('Review and send your message in ' + (channel === 'email' ? 'your email app.' : 'WhatsApp.') + ' If it didn’t open, '));
  const retry = document.createElement('a');
  retry.href = destination;
  retry.textContent = 'open your enquiry here';
  if (channel !== 'email') { retry.target = '_blank'; retry.rel = 'noopener noreferrer'; }
  retry.style.textDecoration = 'underline';
  status.append(retry, document.createTextNode('. Your enquiry has not been sent automatically.'));
});
document.querySelector('#year').textContent = new Date().getFullYear();
