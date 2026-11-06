# Instruções para Publicação (Android)

## 1. IDs e Configurações Pendentes

Antes de gerarem o AAB para produção, deves substituir os seguintes IDs temporários pelos teus IDs reais da conta **Google AdMob** e **Google Play Console**:

### AdMob App ID
No ficheiro `android/app/build.gradle.kts`:
```kotlin
// Substituir pelo teu App ID do AdMob (termina num bloco numérico, tem um ~ no meio)
manifestPlaceholders["adMobAppId"] = "ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY"
```

### AdMob Ad Units (Banner, Interstitial e Rewarded)
No ficheiro `android/app/src/main/java/com/llcgames/zombiebonehunter/NativeAdsController.kt`:
```kotlin
// Substituir pelos IDs dos blocos de anúncios criados no AdMob
const val BANNER_ID = "ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY"
const val INTERSTITIAL_ID = "ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ"
const val REWARDED_ID = "ca-app-pub-XXXXXXXXXXXXXXXX/WWWWWWWWWW"
```

### Produtos In-App (Play Billing)
No ficheiro `android/app/src/main/java/com/llcgames/zombiebonehunter/PlayBillingBridge.kt` e em `src/services/billing.ts`:
- Os produtos `bones_pack_small` e `bones_pack_large` devem ser criados na secção "Produtos integrados na app" da tua Google Play Console.
- Se escolheres IDs diferentes, atualiza o código para corresponder aos IDs corretos.

### URL de Produção (Alojamento Web / Vercel)
No ficheiro `android/app/src/main/java/com/llcgames/zombiebonehunter/MainActivity.kt`:
```kotlin
// O jogo Android carrega a WebView a partir desta URL (ex: versão web Vercel)
webView.loadUrl("https://zombie-bone-hunter.vercel.app")
```
*Garante que fazes o deploy da versão Web (`npm run build`) para a Vercel antes de lançares a app.*

## 2. Geração do Android App Bundle (AAB) no Android Studio

1. Abre a pasta `android` no teu **Android Studio** (File > Open > Selecionar a pasta `android`).
2. Aguarda que o Gradle sincronize automaticamente (pode demorar alguns minutos da primeira vez).
3. No menu de topo, seleciona **Build** > **Generate Signed Bundle / APK...**
4. Escolhe a opção **Android App Bundle** e clica em **Next**.
5. Em "Key store path", clica em **Create new...** (ou escolhe uma existente se já tiveres).
6. Preenche os dados da Keystore (Password, Alias, Key Password) e guarda-a num local seguro! Vais precisar dela para atualizações futuras da app.
7. Avança, seleciona a variante **release** e clica em **Finish**.
8. O AAB será gerado (normalmente dentro de `android/app/release/app-release.aab`).

## 3. Publicar na Google Play

1. Acede à [Google Play Console](https://play.google.com/console).
2. Cria uma **Nova Aplicação** (Jogo).
3. Preenche as **Fichas de Loja**, Categorias e Avaliações de Conteúdo.
4. Na secção de **Produtos na app**, cria os IDs correspondentes (`bones_pack_small`, etc).
5. Na secção **Privacidade / Declaração de Anúncios**, confirma que a app contém anúncios e preenche o formulário de Segurança dos Dados.
6. Vai a **Produção** (ou Testes Fechados) e clica em **Criar Nova Versão**.
7. Faz upload do teu ficheiro `.aab`.
8. Grava, revê e envia para análise pela Google!
