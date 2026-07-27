<template>
  <footer class="app-footer">
    <div class="footer-grid">
      <div class="footer-col">
        <h4 class="footer-logo">Sadlıq Sarayları</h4>
        <p class="footer-about">
          Azərbaycanda toy, nişan və özəl tədbir məkanlarını bir ünvanda toplayan onlayn rezervasiya platforması.
        </p>
      </div>

      <div class="footer-col">
        <h5>Keçidlər</h5>
        <router-link to="/">Ana səhifə</router-link>
        <router-link to="/my-reservations">Rezervlərim</router-link>
        <router-link to="/login">Daxil ol</router-link>
        <router-link to="/register">Qeydiyyat</router-link>
      </div>

      <div class="footer-col">
        <h5>Şəhərlər</h5>
        <span>Bakı</span>
        <span>Sumqayıt</span>
        <span>Gəncə</span>
        <span>Quba</span>
      </div>

      <div class="footer-col">
        <h5>Əlaqə</h5>
        <span>📞 +994 12 000 00 00</span>
        <span>✉️ info@sadliqsaraylari.az</span>
        <span>📍 Bakı, Azərbaycan</span>
      </div>
    </div>

    <div class="footer-bottom">
      © {{ new Date().getFullYear() }} Sadlıq Sarayları — Bütün hüquqlar qorunur.
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  background: #1a1118;
  color: #cbc3c8;
  padding: 44px 40px 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.footer-grid {
  max-width: 1360px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1.3fr;
  gap: 30px;
  padding-bottom: 30px;
}

.footer-logo {
  color: #dfb15b;
  font-size: 1.25rem;
  margin: 0 0 10px;
}

.footer-about {
  font-size: 0.87rem;
  line-height: 1.6;
  margin: 0;
  opacity: 0.85;
  max-width: 320px;
}

.footer-col h5 {
  color: #fff;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 12px;
}

.footer-col a,
.footer-col span {
  display: block;
  color: #cbc3c8;
  text-decoration: none;
  font-size: 0.87rem;
  margin-bottom: 8px;
  transition: color 0.2s;
}

.footer-col a:hover {
  color: #dfb15b;
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  text-align: center;
  padding: 16px 0;
  font-size: 0.8rem;
  opacity: 0.6;
}

@media (max-width: 700px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
