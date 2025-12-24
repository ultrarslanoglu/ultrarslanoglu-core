# Windows Hosts File Update Script
# Bu dosya, localhost'a custom domain'leri map etmek için kullanılır
#
# Windows'da hosts file konumu: C:\Windows\System32\drivers\etc\hosts
# Administrator olarak editör açmanız gerekir
#
# Şu satırları dosyaya ekleyin:
#
# 127.0.0.1 ultrarslanoglu.local
# 127.0.0.1 www.ultrarslanoglu.local
# 127.0.0.1 social-media.local
# 127.0.0.1 social-media.ultrarslanoglu.local
# 127.0.0.1 api.ultrarslanoglu.local
# 127.0.0.1 api.local
#
# Linux/Mac'ta:
# sudo nano /etc/hosts
# 
# Aynı satırları ekleyin
#
# Docker'da Nginx kullanırken:
# docker-compose --profile production up nginx

# PowerShell Script (Windows için)
# İşletici olarak çalıştırın
$hostsPath = "C:\Windows\System32\drivers\etc\hosts"
$domains = @(
    "127.0.0.1 ultrarslanoglu.local",
    "127.0.0.1 www.ultrarslanoglu.local",
    "127.0.0.1 social-media.local",
    "127.0.0.1 social-media.ultrarslanoglu.local",
    "127.0.0.1 api.ultrarslanoglu.local",
    "127.0.0.1 api.local"
)

# Bash Script (Linux/Mac için)
# sudo bash -c '
# cat >> /etc/hosts << EOF
# 127.0.0.1 ultrarslanoglu.local
# 127.0.0.1 www.ultrarslanoglu.local
# 127.0.0.1 social-media.local
# 127.0.0.1 social-media.ultrarslanoglu.local
# 127.0.0.1 api.ultrarslanoglu.local
# 127.0.0.1 api.local
# EOF
# '
