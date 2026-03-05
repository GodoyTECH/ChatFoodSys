// ChatNutri Landing - microinterações e UX suave
// Mantém JS simples para evitar impacto em deploy/config.

document.addEventListener("DOMContentLoaded", () => {
  // Fade-in progressivo na rolagem
  const animated = document.querySelectorAll(".fade-in");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    },
    { threshold: 0.12 }
  );

  animated.forEach((el) => observer.observe(el));
});
