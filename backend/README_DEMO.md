Demo data seeding
=================

Bu dosya, proje geliştiricileri veya test edenler için demo şirketleri ve demo kullanıcıları veritabanına eklemeyi açıklar.

Ne eklenir
- İki demo şirket: `demo-company-a`, `demo-company-b`
- Her şirket için bir admin (`admin@...`) ve bir normal çalışan (`user1@...`) hesap
- Her çalışan için son 30 güne ait günlük 8 saatlik vardiyalar (shifts koleksiyonu)
- `demo-company-a` için aktif örnek abonelik kaydı (subscriptions koleksiyonu)

Nasıl çalıştırılır
1) Gerekli çevresel değişkenleri ayarlayın (örnek):

   export MONGO_URL="mongodb://localhost:27017"
   export DB_NAME="mevcut_db"
   # (İsteğe bağlı) demo parola değiştirmek için:
   export DEMO_PASSWORD="Demo1234!"

2) Script'i çalıştırın:

   python3 backend/seed_demo.py

3) Script başarılı olursa terminalde oluşturulan demo admin e-posta ve parola listesi gösterilecektir. Bu kimlik bilgileri ile uygulamaya giriş yapabilir ve demo şirket verilerini test edebilirsiniz.

Notlar / Güvenlik
- Script, aynı `demo: True` etiketi içeren önceki kayıtları temizler, bu yüzden idempotent olarak yeniden çalıştırabilirsiniz.
- Bu script yalnızca geliştirme/test ortamları içindir. Üretimde çalıştırmayın.
- Demo kullanıcı parolaları bcrypt ile hashlenir (uygulamanın kullandığı biçime uygun).

Sonraki adımlar
- Oluşturulan demo şirket hesaplarını size paylaşacağım (admin e-posta ve parola). Giriş sonrası şirket id'si ve demo kullanıcıyla test etmeye başlayabilirsiniz.
