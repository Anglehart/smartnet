window.onload = initFunction();

function initFunction() {
  document.querySelectorAll('.controlButton').forEach((item) => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.controlButton').forEach((item) => {item.classList.remove('controlActive')})
      event.target.classList.add('controlActive');

      document.querySelectorAll('.page').forEach((item) => {item.classList.add('disable')});
      const pageId = `${event.target.id}Page`
      document.getElementById(pageId).classList.remove('disable');
    })
  });

}
