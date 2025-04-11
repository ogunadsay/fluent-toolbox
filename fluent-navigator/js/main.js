document.addEventListener('DOMContentLoaded', () => {
  // Get all cards
  const cards = document.querySelectorAll('.card');
  
  // Add click event to each card
  cards.forEach(card => {
    // Get URL from data attribute
    const url = card.getAttribute('data-url');
    
    // Get the launch button within this card
    const launchBtn = card.querySelector('.launch-btn');
    
    // Add click event to the card
    card.addEventListener('click', () => {
      window.location.href = url;
    });
    
    // Add click event to the launch button
    // Using stopPropagation to prevent the card's click event from firing
    launchBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.location.href = url;
    });
  });
  
  // Add subtle animation to cards when page loads
  setTimeout(() => {
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, index * 150);
    });
  }, 300);
});
