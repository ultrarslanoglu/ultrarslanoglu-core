/**
 * Meta (Facebook/Instagram) Login Helper
 * Facebook SDK ile entegrasyon
 */

class MetaAuthHelper {
  constructor(appId = '1044312946830625', version = 'v19.0') {
    this.appId = appId;
    this.version = version;
    this.isSDKLoaded = false;
  }

  /**
   * Facebook SDK'yı sayfaya dinamik olarak ekle
   */
  loadFacebookSDK() {
    return new Promise((resolve, reject) => {
      if (window.FB) {
        this.isSDKLoaded = true;
        resolve();
        return;
      }

      window.fbAsyncInit = () => {
        FB.init({
          appId: this.appId,
          cookie: true,
          xfbml: true,
          version: this.version
        });
        
        FB.AppEvents.logPageView();
        this.isSDKLoaded = true;
        resolve();
      };

      // SDK'yı dinamik olarak yükle
      const script = document.createElement('script');
      script.src = `https://connect.facebook.net/tr_TR/sdk.js#xfbml=1&version=${this.version}&appId=${this.appId}&autoLogAppEvents=1`;
      script.async = true;
      script.defer = true;
      script.onerror = () => reject(new Error('Facebook SDK yüklenemedi'));
      
      document.body.appendChild(script);
    });
  }

  /**
   * Facebook ile login yap
   */
  async login(permissions = ['email', 'public_profile', 'instagram_basic']) {
    if (!this.isSDKLoaded) {
      await this.loadFacebookSDK();
    }

    return new Promise((resolve, reject) => {
      FB.login((response) => {
        if (response.authResponse) {
          console.log('Başarıyla login olundu:', response.authResponse);
          resolve(response.authResponse);
        } else {
          console.error('Login başarısız:', response);
          reject(new Error('Facebook login başarısız'));
        }
      }, { scope: permissions.join(',') });
    });
  }

  /**
   * Mevcut login durumunu kontrol et
   */
  async getLoginStatus() {
    if (!this.isSDKLoaded) {
      await this.loadFacebookSDK();
    }

    return new Promise((resolve, reject) => {
      FB.getLoginStatus((response) => {
        resolve({
          status: response.status,
          authResponse: response.authResponse || null,
          isConnected: response.status === 'connected'
        });
      });
    });
  }

  /**
   * Facebook SDK ile user info al
   */
  async getUserInfo() {
    if (!this.isSDKLoaded) {
      await this.loadFacebookSDK();
    }

    return new Promise((resolve, reject) => {
      FB.api('/me', { fields: 'id,name,email,picture' }, (response) => {
        if (response.error) {
          reject(new Error(response.error.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Facebook logout
   */
  async logout() {
    if (!this.isSDKLoaded) {
      await this.loadFacebookSDK();
    }

    return new Promise((resolve, reject) => {
      FB.logout((response) => {
        console.log('Logout başarılı');
        resolve(response);
      });
    });
  }

  /**
   * Instagram hesaplarını al
   */
  async getInstagramAccounts(accessToken) {
    try {
      const response = await fetch(
        `https://graph.instagram.com/me/accounts?access_token=${accessToken}`
      );
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }
      
      return data.data || [];
    } catch (error) {
      console.error('Instagram hesapları alınamadı:', error);
      throw error;
    }
  }

  /**
   * Backend'e token gönder
   */
  async sendTokenToBackend(accessToken, userId) {
    try {
      const response = await fetch('/auth/meta/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accessToken,
          userId,
          provider: 'meta'
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Token kaydedilemedi');
      }
      
      return data;
    } catch (error) {
      console.error('Token gönderme hatası:', error);
      throw error;
    }
  }
}

// Global olarak kullan
if (typeof window !== 'undefined') {
  window.MetaAuthHelper = MetaAuthHelper;
}

// Node.js modülü olarak da kullan
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MetaAuthHelper;
}
