// Bootstrap validation: add feedback styles when the user tries to submit.
// Runs after DOM is ready so forms from EJS layouts are always present.
document.addEventListener('DOMContentLoaded', () => {
  'use strict'

  document.querySelectorAll('.needs-validation').forEach((form) => {
    form.addEventListener(
      'submit',
      (event) => {
        if (!form.checkValidity()) {
          event.preventDefault()
          event.stopPropagation()
        }
        form.classList.add('was-validated')
      },
      false
    )
  })
})