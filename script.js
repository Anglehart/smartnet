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

  document.querySelectorAll('.sphereBlock').forEach((item, i) => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.sphereBlock').forEach((item) => {item.classList.remove('fullSphere')})
      event.currentTarget.classList.add('fullSphere');
    })
  });

  document.querySelectorAll('.connectBlock h3').forEach((item, i) => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.connectBlock').forEach((item) => {item.classList.remove('fullConnect')})
      document.querySelectorAll('.connectBlock h3').forEach((item) => {item.classList.remove('openTab')})
      event.currentTarget.parentNode.classList.add('fullConnect');
      event.currentTarget.classList.add('openTab');
    })
  });


}
