function detectQuickApply() {
  const quickApplyButtons = document.querySelectorAll('a[data-automation="job-detail-apply"]');

  quickApplyButtons.forEach(button => {
    button.addEventListener('click', () => {
      console.log("Quick Apply button clicked!");
      setTimeout(detectAndIdentifySeekForm, 1000);
    });
  });
}

detectQuickApply();

function detectAndIdentifySeekForm() {
  const formContainer = document.querySelector('[data-automation="apply-modal-container"] form, form[aria-label="Application form"]');

  if (formContainer) {
    console.log("✅ Seek Quick Apply form detected!");
    identifyFieldTypes(formContainer);
  } else {
    console.warn("❌ Seek Quick Apply form not found. Retrying...");
    setTimeout(detectAndIdentifySeekForm, 500); // Retry after a short delay
  }
}