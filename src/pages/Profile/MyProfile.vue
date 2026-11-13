<template>
  <div class="profile-page">
    <div class="profile-inner">
      <header class="page-head">
        <div>
          <h1 class="page-title">Hesabım</h1>
          <p class="page-sub">Şəxsi məlumatlarınızı və parolunuzu buradan idarə edin</p>
        </div>
      </header>

      <div class="profile-grid">
        <!-- Hesab kartı -->
        <aside class="account-card">
          <div class="avatar">{{ initials }}</div>
          <h3>{{ auth.user?.firstName }} {{ auth.user?.lastName }}</h3>
          <span class="role-tag" :class="roleClass">{{ roleText }}</span>

          <ul class="account-facts">
            <li><span>E-poçt</span><b>{{ auth.user?.email }}</b></li>
            <li><span>Telefon</span><b>{{ auth.user?.phone }}</b></li>
            <li v-if="memberSince"><span>Qeydiyyat</span><b>{{ memberSince }}</b></li>
          </ul>

          <UiButton variant="danger" block @click="auth.logout()">Hesabdan çıx</UiButton>
        </aside>

        <div class="forms">
          <!-- Şəxsi məlumatlar -->
          <UiCard title="Şəxsi məlumatlar" sub="E-poçt ünvanı dəyişdirilə bilmir — o, hesabınızın açarıdır.">
            <el-form label-position="top" @submit.prevent>
              <div class="name-row">
                <el-form-item label="Ad">
                  <el-input v-model="profileForm.firstName" placeholder="Ad" />
                </el-form-item>
                <el-form-item label="Soyad">
                  <el-input v-model="profileForm.lastName" placeholder="Soyad" />
                </el-form-item>
              </div>

              <el-form-item label="Telefon">
                <el-input v-model="profileForm.phone" placeholder="+994 xx xxx xx xx" />
              </el-form-item>

              <el-form-item label="E-poçt">
                <el-input :model-value="auth.user?.email" disabled />
              </el-form-item>

              <p v-if="profileError" class="form-error">{{ profileError }}</p>

              <div class="form-foot">
                <UiButton :disabled="!profileChanged" :is-loading="isSavingProfile" @click="saveProfile">
                  Yadda saxla
                </UiButton>
                <button v-if="profileChanged" class="link-btn" @click="resetProfileForm">İmtina</button>
              </div>
            </el-form>
          </UiCard>

          <!-- Parol dəyişmə -->
          <UiCard title="Parolun dəyişdirilməsi" sub="Yeni parol ən azı 6 simvol olmalıdır.">
            <el-form label-position="top" @submit.prevent>
              <el-form-item label="Cari parol">
                <el-input v-model="passwordForm.currentPassword" type="password" show-password placeholder="Cari parolunuz" />
              </el-form-item>

              <el-form-item label="Yeni parol">
                <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="Yeni parol" />
              </el-form-item>

              <el-form-item label="Yeni parol (təkrar)">
                <el-input v-model="passwordForm.repeatPassword" type="password" show-password placeholder="Yeni parolu təkrarlayın" />
              </el-form-item>

              <p v-if="passwordError" class="form-error">{{ passwordError }}</p>

              <div class="form-foot">
                <UiButton :is-loading="isSavingPassword" @click="savePassword">Parolu dəyiş</UiButton>
              </div>
            </el-form>
          </UiCard>

          <!-- Bildiriş seçimləri -->
          <UiCard
            title="Bildirişlər"
            sub="Rezervinizlə bağlı bildirişlər həmişə gəlir — onlar xidmətin bir hissəsidir. Söndürə biləcəyiniz yalnız elanlardır."
          >
            <label class="switch-row">
              <div>
                <b>Elanlar və kampaniyalar</b>
                <span>Endirimlər, yeni imkanlar, mövsümi təkliflər</span>
              </div>
              <el-switch v-model="prefs.allowAnnouncements" @change="savePrefs" />
            </label>

            <div class="prefs-note">
              <b>Həmişə gələnlər:</b> rezervin təsdiqi və rəddi, sarayın əks-təklifi,
              tarixin bağlanması, sorğunuza gələn təkliflər və yazışma mesajları.
            </div>
          </UiCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { toast } from '@/utils/toast'
import { useAuthStore } from '@/store/auth'
import { formatDateFull } from '@/utils/date'
import { getPreferences, updatePreferences } from '@/services/notificationService'
import UiButton from '@/components/ui/UiButton.vue'
import UiCard from '@/components/ui/UiCard.vue'

const auth = useAuthStore()

const profileForm = reactive({ firstName: '', lastName: '', phone: '' })
const passwordForm = reactive({ currentPassword: '', newPassword: '', repeatPassword: '' })

const isSavingProfile = ref(false)
const isSavingPassword = ref(false)
const profileError = ref('')
const passwordError = ref('')

// Formanı cari profil məlumatları ilə doldurur
const resetProfileForm = () => {
  profileForm.firstName = auth.user?.firstName ?? ''
  profileForm.lastName = auth.user?.lastName ?? ''
  profileForm.phone = auth.user?.phone ?? ''
  profileError.value = ''
}

watch(() => auth.user, resetProfileForm, { immediate: true, deep: true })

const profileChanged = computed(
  () =>
    profileForm.firstName !== auth.user?.firstName ||
    profileForm.lastName !== auth.user?.lastName ||
    profileForm.phone !== auth.user?.phone,
)

const initials = computed(() => {
  const first = auth.user?.firstName?.[0] ?? ''
  const last = auth.user?.lastName?.[0] ?? ''
  return `${first}${last}`.toLocaleUpperCase('az') || '?'
})

const roleText = computed(
  () =>
    ({
      Customer: 'Müştəri',
      Owner: 'Saray rəhbərliyi',
      VenueAdmin: 'Saray administratoru',
      Support: 'Dəstək admini',
      SuperAdmin: 'Platforma sahibi',
    })[auth.user?.role] ?? '—',
)

const roleClass = computed(() => (auth.user?.role ?? 'Customer').toLowerCase())

const memberSince = computed(() =>
  auth.user?.createdAt ? formatDateFull(auth.user.createdAt.slice(0, 10)) : null,
)

// Ad və telefonu yeniləyir
const saveProfile = async () => {
  isSavingProfile.value = true
  profileError.value = ''
  try {
    const message = await auth.updateProfile({
      firstName: profileForm.firstName.trim(),
      lastName: profileForm.lastName.trim(),
      phone: profileForm.phone.trim(),
    })
    toast.success(message)
  } catch (e) {
    profileError.value = e?.userMessage ?? e?.message ?? 'Xəta baş verdi'
  } finally {
    isSavingProfile.value = false
  }
}

// Parolu dəyişir; təkrar yoxlaması frontend tərəfdə aparılır
const savePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.repeatPassword) {
    passwordError.value = 'Yeni parollar üst-üstə düşmür.'
    return
  }

  isSavingPassword.value = true
  passwordError.value = ''
  try {
    const message = await auth.changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    })
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.repeatPassword = ''
    toast.success(message)
  } catch (e) {
    passwordError.value = e?.userMessage ?? e?.message ?? 'Xəta baş verdi'
  } finally {
    isSavingPassword.value = false
  }
}

// ————— bildiriş seçimləri —————

const prefs = reactive({ allowAnnouncements: true, allowEmail: true, allowSms: true })

const savePrefs = async () => {
  try {
    const result = await updatePreferences({ ...prefs })
    toast.success(result.message)
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Seçim saxlanmadı')
  }
}

onMounted(async () => {
  Object.assign(prefs, await getPreferences())
})
</script>

<style scoped>
.profile-page {
  min-height: calc(100vh - 61px);
  background: #f4f6f8;
  padding: 30px 40px 60px;
  font-family: var(--font);
}

.profile-inner {
  max-width: var(--page-w);
  margin: 0 auto;
}

.page-head {
  margin-bottom: 24px;
}

.page-title {
  margin: 0 0 4px;
  color: var(--ink);
  font-size: 1.7rem;
}

.page-sub {
  margin: 0;
  color: #6c757d;
  font-size: 0.92rem;
}

/* Səhifə qabı geniş olsa da forma sütunu genişlənmir: ad, telefon,
   parol sahələri 700px-dən uzun olanda oxunmur, sahə ilə məzmun
   arasındakı nisbət pozulur. */
.profile-grid {
  display: grid;
  grid-template-columns: 300px minmax(0, 700px);
  gap: 22px;
  align-items: start;
  justify-content: start;
}

/* Sol hesab kartı */
.account-card {
  background: linear-gradient(180deg, #fff 0%, #fdfbfc 100%);
  border: 1px solid #f2ecee;
  border-radius: 16px;
  padding: 24px 20px 20px;
  text-align: center;
  box-shadow: 0 6px 20px rgba(114, 20, 56, 0.06);
}

.avatar {
  width: 68px;
  height: 68px;
  margin: 0 auto 12px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 1.5rem;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, var(--brand), #b07d2b);
  box-shadow: 0 8px 18px rgba(114, 20, 56, 0.25);
}

.account-card h3 {
  margin: 0 0 8px;
  color: var(--ink);
  font-size: 1.1rem;
}

.role-tag {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
  background: #f1f3f5;
  color: var(--muted);
}

.role-tag.customer {
  background: #fdf6e9;
  color: #8a6220;
}

.role-tag.owner {
  background: var(--brand-soft);
  color: var(--brand);
}

.account-facts {
  list-style: none;
  margin: 18px 0 18px;
  padding: 16px 0 0;
  border-top: 1px solid #f2ecee;
  text-align: left;
}

.account-facts li {
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin-bottom: 12px;
}

.account-facts span {
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #b8a3ab;
  font-weight: 700;
}

.account-facts b {
  font-size: 0.88rem;
  color: var(--ink);
  word-break: break-all;
}

/* Sağ formalar */
.forms {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Bildiriş seçimi sətri */
.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-top: 1px solid #f4eef0;
  cursor: pointer;
}

.switch-row b {
  display: block;
  font-size: 0.87rem;
  color: var(--ink);
}

.switch-row span {
  font-size: 0.78rem;
  color: var(--muted);
}

.prefs-note {
  margin-top: 8px;
  background: #fbf8f9;
  border-radius: 10px;
  padding: 11px 14px;
  font-size: 0.78rem;
  color: #6c757d;
  line-height: 1.6;
}

.prefs-note b {
  color: var(--ink-2);
}

.form-foot {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 6px;
}

.link-btn {
  background: none;
  border: none;
  color: var(--muted);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.link-btn:hover {
  color: var(--brand);
  text-decoration: underline;
}

.name-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.form-error {
  margin: 0 0 10px;
  color: #d93025;
  font-size: 13px;
  white-space: pre-line;
}

@media (max-width: 820px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }

  .profile-page {
    padding: 24px 16px 50px;
  }

  .name-row {
    grid-template-columns: 1fr;
  }

  .switch-row {
    align-items: flex-start;
  }
}
</style>
