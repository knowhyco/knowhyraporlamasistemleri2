.PHONY: setup start stop restart clean logs build

# Projeyi başlat
start:
	docker-compose up -d

# Projeyi durdur
stop:
	docker-compose down

# Docker imajlarını yeniden inşa ederek projeyi başlat
build:
	docker-compose up -d --build

# Projeyi yeniden başlat
restart:
	docker-compose restart

# Tüm Docker container ve imajlarını temizle
clean:
	docker-compose down --rmi all --volumes --remove-orphans

# Logları görüntüle
logs:
	docker-compose logs -f

# Tüm bağımlılıkları kur ve projeyi kur
setup:
	@echo "Knowhy Raporlama Sistemi kurulumu başlatılıyor..."
	@echo "Proje dosyalarını hazırlama..."
	mkdir -p backend/logs
	mkdir -p backend/sql_scripts/sql_files
	@echo ".env dosyası kontrol ediliyor..."
	test -f .env || cp .env.example .env
	@echo "Docker imajlarını oluşturma..."
	docker-compose build
	@echo "Kurulum tamamlandı! 'make start' komutu ile sistemi başlatabilirsiniz."

# Yardım
help:
	@echo "Knowhy Raporlama Sistemi Komutları"
	@echo "--------------------------------"
	@echo "setup: Tüm bağımlılıkları kur ve projeyi kur"
	@echo "start: Projeyi başlat"
	@echo "stop: Projeyi durdur"
	@echo "restart: Projeyi yeniden başlat"
	@echo "build: Docker imajlarını yeniden oluştur"
	@echo "clean: Tüm Docker container ve imajlarını temizle"
	@echo "logs: Container loglarını görüntüle" 