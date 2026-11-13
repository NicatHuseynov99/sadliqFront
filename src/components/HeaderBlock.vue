<template>
  <header class="app-header">
    <router-link to="/" class="logo" @click="isMenuOpen = false">
      <BrandMark :size="26" />
      <span class="logo-word">TOY<b>UN</b></span>
    </router-link>

    <!-- Geniş ekranda düz sətir, darda açılan menyu -->
    <nav class="nav-links" :class="{ open: isMenuOpen }" @click="isMenuOpen = false">
      <router-link to="/">Ana səhifə</router-link>
      <router-link v-if="auth.isSuperAdmin" to="/admin" class="panel-link"><Settings :size="16" /> Admin panel</router-link>
      <router-link v-else-if="auth.isSupport" to="/admin" class="panel-link"><LifeBuoy :size="16" /> Admin panel</router-link>
      <router-link v-if="auth.canManageVenues" to="/panel" class="panel-link"><Building2 :size="16" /> Saraylar</router-link>
      <router-link v-if="auth.isCustomer" to="/favorites">Seçilmişlər</router-link>
      <router-link v-if="auth.isCustomer" to="/my-reservations">Rezervlərim</router-link>
      <router-link v-if="auth.isCustomer" to="/sorgularim">Sorğularım</router-link>

      <!-- Menyu açılanda hesab əməliyyatları da burada olsun -->
      <div class="nav-account" v-if="auth.isAuth">
        <router-link to="/sikayetlerim"><Scale :size="16" /> Şikayətlərim</router-link>
        <router-link to="/profile"><UserRound :size="16" /> {{ auth.user?.fullName }}</router-link>
        <button class="ghost-btn" @click="auth.logout()">Çıxış</button>
      </div>
    </nav>

    <div class="user-box" v-if="auth.isAuth">
      <NotificationBell />
      <router-link to="/profile" class="user-name"><UserRound :size="17" /><span class="name-full">{{ auth.user?.fullName }}</span><span class="name-first">{{ firstName }}</span></router-link>
      <button class="ghost-btn hide-narrow" @click="auth.logout()">Çıxış</button>

      <button class="burger" :class="{ on: isMenuOpen }" title="Menyu" @click="isMenuOpen = !isMenuOpen">
        <i></i><i></i><i></i>
      </button>
    </div>

    <div class="user-box" v-else>
      <router-link to="/register">
        <button class="ghost-btn">Qeydiyyat</button>
      </router-link>
      <router-link to="/login">
        <button class="gold-btn">Daxil ol</button>
      </router-link>

      <button class="burger" :class="{ on: isMenuOpen }" title="Menyu" @click="isMenuOpen = !isMenuOpen">
        <i></i><i></i><i></i>
      </button>
    </div>
  </header>

  <!-- Telefonda əsas keçidlər barmağın çatdığı yerdə: aşağıda -->
  <nav v-if="auth.isCustomer" class="bottom-nav">
    <router-link to="/"><Search :size="21" />Axtar</router-link>
    <router-link to="/sorgularim"><Megaphone :size="21" />Sorğularım</router-link>
    <router-link to="/favorites"><Heart :size="21" />Seçilmiş</router-link>
    <router-link to="/my-reservations"><CalendarDays :size="21" />Rezervlər</router-link>
  </nav>

  <!-- Qonaq üçün də alt naviqasiya: əvvəl yalnız müştəridə vardı və
       giriş etməmiş adam telefonda əsas yolları burger menyusunda axtarırdı -->
  <nav v-else-if="!auth.isAuth" class="bottom-nav">
    <router-link to="/"><Search :size="21" />Axtar</router-link>
    <router-link to="/saray-elave-et"><Building2 :size="21" />Saray əlavə et</router-link>
    <router-link to="/register"><UserRoundPlus :size="21" />Qeydiyyat</router-link>
    <router-link to="/login"><LogIn :size="21" />Daxil ol</router-link>
  </nav>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import {
  Building2, CalendarDays, Heart, LifeBuoy, LogIn, Megaphone, Scale, Search, Settings, UserRound, UserRoundPlus,
} from 'lucide-vue-next'
import NotificationBell from '@/components/NotificationBell.vue'
import BrandMark from '@/components/BrandMark.vue'

const auth = useAuthStore()
const route = useRoute()

const isMenuOpen = ref(false)

// Telefonda ad və soyad sığmır və yarıda kəsilirdi — yalnız ad göstərilir
const firstName = computed(() => auth.user?.firstName || (auth.user?.fullName ?? '').trim().split(/s+/)[0] || '')

// Səhifə dəyişəndə menyu açıq qalmasın
watch(
  () => route.fullPath,
  () => (isMenuOpen.value = false),
)
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 40px;
  background: var(--ink);
  position: sticky;
  top: 0;
  z-index: 100;
  font-family: var(--font);
}

.logo {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: var(--gold);
  text-decoration: none;
  white-space: nowrap;
}

.logo-word {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.32rem;
  letter-spacing: 0.04em;
  color: #fff;
}

.logo-word b {
  font-weight: 600;
  color: var(--gold);
}

/* İkonlu keçidlər: ikon və mətn bir xətdə */
.nav-links a,
.nav-account a,
.user-name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.user-name span {
  overflow: hidden;
  text-overflow: ellipsis;
}

.name-first {
  display: none;
}

.nav-links a {
  color: #cbc3c8;
  text-decoration: none;
  margin: 0 12px;
  font-size: 0.92rem;
  font-weight: 500;
  transition: color var(--t);
}

.nav-links a:hover,
.nav-links a.menu-item-active {
  color: var(--gold);
}

.panel-link {
  color: var(--gold) !important;
  font-weight: 700 !important;
}

.nav-account {
  display: none;
}

.user-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-box a {
  text-decoration: none;
}

.user-name {
  font-weight: 500;
  color: #fff;
  font-size: 0.9rem;
  text-decoration: none;
  transition: color var(--t);
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-name:hover {
  color: var(--gold);
}

.ghost-btn {
  background: transparent;
  color: #cbc3c8;
  border: 1px solid rgba(255, 255, 255, 0.25);
  padding: 7px 16px;
  border-radius: var(--r-sm);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all var(--t);
}

.ghost-btn:hover {
  color: #fff;
  border-color: var(--gold);
}

.gold-btn {
  background: var(--gold);
  color: var(--ink);
  border: none;
  padding: 8px 18px;
  border-radius: var(--r-sm);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 700;
  transition: background var(--t);
}

.gold-btn:hover {
  background: #ecc272;
}

/* Burger — yalnız dar ekranda görünür */
.burger {
  display: none;
  flex-direction: column;
  /* Düymənin minimum hündürlüyü var (toxunma sahəsi) — xətlər ortada
     dayanmasa yuxarıya yapışır və yanındakı ad aşağı sallanmış görünür */
  justify-content: center;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
}

.burger i {
  width: 20px;
  height: 2px;
  background: #fff;
  border-radius: 2px;
  transition: transform var(--t), opacity var(--t);
}

.burger.on i:nth-child(1) {
  transform: translateY(6px) rotate(45deg);
}

.burger.on i:nth-child(2) {
  opacity: 0;
}

.burger.on i:nth-child(3) {
  transform: translateY(-6px) rotate(-45deg);
}

/* Telefonda alt naviqasiya */
.bottom-nav {
  display: none;
}

@media (max-width: 960px) {
  .app-header {
    padding: 12px 18px;
  }

  .burger {
    display: flex;
  }

  .hide-narrow {
    display: none;
  }

  .user-name {
    max-width: none;
    flex: none;
  }

  .name-full {
    display: none;
  }

  .name-first {
    display: inline;
    overflow: visible;
  }

  /* Menyu başlığın altından açılır */
  .nav-links {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--ink);
    display: none;
    flex-direction: column;
    padding: 10px 18px 18px;
    box-shadow: var(--shadow-3);
  }

  .nav-links.open {
    display: flex;
  }

  .nav-links a {
    margin: 0;
    padding: 11px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .nav-account {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding-top: 12px;
  }

  .nav-account a {
    color: #fff;
  }
}

/* Barmaq üçün toxunma sahəsi. Ölçüldü: loqo 122×22, istifadəçi adı
   103×20 — barmaq üçün alçaqdır. Yazı ölçüsü eyni qalır, yalnız
   yuxarı-aşağı boşluq əlavə olunur ki, sahə ~40px olsun. */
@media (max-width: 960px) {
  .logo,
  .user-name {
    display: inline-flex;
    align-items: center;
    min-height: 40px;
  }
}

/* Ən dar telefonlarda (320–400px) başlıq sığmırdı: loqo + «Qeydiyyat» +
   «Daxil ol» + menyu düyməsi yan-yana ekrandan kənara çıxırdı və
   «Daxil ol» sağdan kəsilirdi. */
@media (max-width: 420px) {
  .app-header {
    padding: 12px 14px;
  }

  .logo-word {
    font-size: 1.15rem;
  }

  /* «Qeydiyyat» gizlənir — giriş səhifəsində «Hesabınız yoxdur?
     Qeydiyyatdan keçin» keçidi onsuz da var, ona görə yol itmir. */
  .user-box .ghost-btn {
    display: none;
  }

  .user-box {
    gap: 8px;
  }
}

@media (max-width: 700px) {
  .bottom-nav {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 95;
    display: flex;
    background: var(--surface);
    border-top: 1px solid var(--line);
    box-shadow: 0 -4px 18px rgba(26, 17, 24, 0.08);
    padding: 6px 0 8px;
  }

  .bottom-nav a {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    text-decoration: none;
    font-size: 0.72rem;
    color: var(--muted);
  }

  .bottom-nav a svg {
    stroke-width: 1.8;
  }

  .bottom-nav a.menu-item-active svg {
    stroke-width: 2.2;
  }

  .bottom-nav a.menu-item-active {
    color: var(--brand);
    font-weight: 600;
  }
}
</style>
