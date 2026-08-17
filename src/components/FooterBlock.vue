<template>
  <footer class="app-footer">
    <div class="footer-grid">
      <div class="footer-col">
        <h4 class="footer-logo">Şadlıq Sarayları</h4>
        <p class="footer-about">
          Azərbaycanda toy, nişan və özəl tədbir məkanlarını bir ünvanda toplayan onlayn rezervasiya platforması.
        </p>
      </div>

      <div class="footer-col">
        <h5>Keçidlər</h5>
        <router-link to="/">Ana səhifə</router-link>
        <router-link to="/profile">Hesabım</router-link>
        <router-link to="/favorites">Seçilmişlər</router-link>
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
      © {{ new Date().getFullYear() }} Şadlıq Sarayları — Bütün hüquqlar qorunur.
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  background: var(--ink);
  color: #cbc3c8;
  padding: 44px 40px 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.footer-grid {
  max-width: var(--page-w);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1.3fr;
  gap: 30px;
  padding-bottom: 30px;
}

.footer-logo {
  color: var(--gold);
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
  color: var(--gold);
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  text-align: center;
  padding: 16px 0;
  font-size: 0.8rem;
  opacity: 0.6;
}

@media (max-width: 700px) {
  /* Telefonda dörd sütunun hamısını iki yarıya bölmək dağınıq çıxırdı:
     brend adı iki sətrə qırılır, uzun izah mətni 170px-lik sütunda
     yırtıq görünür, e-poçt ünvanı isə sığmırdı.
     İndi uzun məzmunlu bloklar tam eni tutur, yalnız qısa keçid
     siyahıları yan-yana qalır. */
  .app-footer {
    padding: 28px 16px 0;
  }

  .footer-grid {
    grid-template-columns: 1fr 1fr;
    gap: 22px 16px;
    padding-bottom: 22px;
  }

  /* Brend bloku və əlaqə — tam en */
  .footer-col:first-child,
  .footer-col:last-child {
    grid-column: 1 / -1;
  }

  .footer-about {
    max-width: none;
  }

  /* Uzun e-poçt ünvanı kənara çıxmasın */
  .footer-col span {
    overflow-wrap: anywhere;
  }

  .footer-col h5 {
    margin-bottom: 9px;
  }
}
</style>
