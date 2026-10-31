(function () {
  try {
    var t = localStorage.getItem('theme')
    var dark =
      t === 'dark' || (t !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
  } catch {}
})()
