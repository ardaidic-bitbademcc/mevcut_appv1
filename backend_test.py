#!/usr/bin/env python3
"""
Backend API Testing for Stock Management Module
Tests all Stock Management endpoints comprehensively
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "https://staffsync-23.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@example.com"

class StockManagementTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_user = None
        self.test_results = {
            "passed": 0,
            "failed": 0,
            "errors": []
        }
        
    def log_result(self, test_name, success, message="", response_data=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if message:
            print(f"   {message}")
        if response_data and not success:
            print(f"   Response: {response_data}")
        
        if success:
            self.test_results["passed"] += 1
        else:
            self.test_results["failed"] += 1
            self.test_results["errors"].append(f"{test_name}: {message}")
        print()
    
    def authenticate(self):
        """Authenticate as admin user"""
        print("🔐 Authenticating as admin...")
        try:
            response = self.session.post(f"{BASE_URL}/login", json={"email": ADMIN_EMAIL})
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.admin_user = data.get("employee")
                    self.log_result("Admin Authentication", True, f"Logged in as {self.admin_user['ad']} {self.admin_user['soyad']}")
                    return True
                else:
                    self.log_result("Admin Authentication", False, data.get("message", "Login failed"))
                    return False
            else:
                self.log_result("Admin Authentication", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Admin Authentication", False, f"Exception: {str(e)}")
            return False
    
    def test_stock_units_get(self):
        """Test GET /api/stok-birim"""
        print("📦 Testing Stock Units - GET endpoint...")
        try:
            response = self.session.get(f"{BASE_URL}/stok-birim")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("GET /api/stok-birim", True, f"Retrieved {len(data)} stock units")
                    return data
                else:
                    self.log_result("GET /api/stok-birim", False, "Response is not a list", data)
                    return []
            else:
                self.log_result("GET /api/stok-birim", False, f"HTTP {response.status_code}", response.text)
                return []
        except Exception as e:
            self.log_result("GET /api/stok-birim", False, f"Exception: {str(e)}")
            return []
    
    def test_stock_units_post(self):
        """Test POST /api/stok-birim"""
        print("📦 Testing Stock Units - POST endpoint...")
        test_unit = {"ad": "Test Unit", "kisaltma": "tu"}
        try:
            response = self.session.post(f"{BASE_URL}/stok-birim", json=test_unit)
            if response.status_code == 200:
                data = response.json()
                if data.get("ad") == test_unit["ad"] and data.get("kisaltma") == test_unit["kisaltma"]:
                    self.log_result("POST /api/stok-birim", True, f"Created unit with ID {data.get('id')}")
                    return data
                else:
                    self.log_result("POST /api/stok-birim", False, "Created unit data doesn't match", data)
                    return None
            else:
                self.log_result("POST /api/stok-birim", False, f"HTTP {response.status_code}", response.text)
                return None
        except Exception as e:
            self.log_result("POST /api/stok-birim", False, f"Exception: {str(e)}")
            return None
    
    def test_stock_units_delete(self, unit_id, should_fail=False):
        """Test DELETE /api/stok-birim/{birim_id}"""
        print(f"📦 Testing Stock Units - DELETE endpoint (ID: {unit_id})...")
        try:
            response = self.session.delete(f"{BASE_URL}/stok-birim/{unit_id}")
            if should_fail:
                # Expecting this to fail (unit in use)
                if response.status_code == 400:
                    data = response.json()
                    if "kullanımda" in data.get("detail", "").lower():
                        self.log_result("DELETE /api/stok-birim (validation)", True, "Correctly prevented deletion of unit in use")
                        return True
                    else:
                        self.log_result("DELETE /api/stok-birim (validation)", False, "Wrong error message", data)
                        return False
                else:
                    self.log_result("DELETE /api/stok-birim (validation)", False, f"Expected 400, got {response.status_code}")
                    return False
            else:
                # Expecting success
                if response.status_code == 200:
                    self.log_result("DELETE /api/stok-birim", True, "Unit deleted successfully")
                    return True
                else:
                    self.log_result("DELETE /api/stok-birim", False, f"HTTP {response.status_code}", response.text)
                    return False
        except Exception as e:
            self.log_result("DELETE /api/stok-birim", False, f"Exception: {str(e)}")
            return False
    
    def test_stock_products_get(self):
        """Test GET /api/stok-urun"""
        print("🥫 Testing Stock Products - GET endpoint...")
        try:
            response = self.session.get(f"{BASE_URL}/stok-urun")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("GET /api/stok-urun", True, f"Retrieved {len(data)} products")
                    return data
                else:
                    self.log_result("GET /api/stok-urun", False, "Response is not a list", data)
                    return []
            else:
                self.log_result("GET /api/stok-urun", False, f"HTTP {response.status_code}", response.text)
                return []
        except Exception as e:
            self.log_result("GET /api/stok-urun", False, f"Exception: {str(e)}")
            return []
    
    def test_stock_products_post(self, birim_id):
        """Test POST /api/stok-urun"""
        print("🥫 Testing Stock Products - POST endpoint...")
        test_product = {
            "ad": "Test Product",
            "birim_id": birim_id,
            "kategori": "malzeme",
            "min_stok": 10
        }
        try:
            response = self.session.post(f"{BASE_URL}/stok-urun", json=test_product)
            if response.status_code == 200:
                data = response.json()
                if (data.get("ad") == test_product["ad"] and 
                    data.get("birim_id") == test_product["birim_id"] and
                    data.get("kategori") == test_product["kategori"]):
                    self.log_result("POST /api/stok-urun", True, f"Created product with ID {data.get('id')}")
                    return data
                else:
                    self.log_result("POST /api/stok-urun", False, "Created product data doesn't match", data)
                    return None
            else:
                self.log_result("POST /api/stok-urun", False, f"HTTP {response.status_code}", response.text)
                return None
        except Exception as e:
            self.log_result("POST /api/stok-urun", False, f"Exception: {str(e)}")
            return None
    
    def test_stock_products_put(self, product_id):
        """Test PUT /api/stok-urun/{urun_id}"""
        print(f"🥫 Testing Stock Products - PUT endpoint (ID: {product_id})...")
        update_data = {
            "ad": "Updated Test Product",
            "birim_id": 1,  # Using existing unit
            "kategori": "içecek",
            "min_stok": 15
        }
        try:
            response = self.session.put(f"{BASE_URL}/stok-urun/{product_id}", json=update_data)
            if response.status_code == 200:
                data = response.json()
                if data.get("ad") == update_data["ad"] and data.get("kategori") == update_data["kategori"]:
                    self.log_result("PUT /api/stok-urun", True, "Product updated successfully")
                    return data
                else:
                    self.log_result("PUT /api/stok-urun", False, "Updated product data doesn't match", data)
                    return None
            else:
                self.log_result("PUT /api/stok-urun", False, f"HTTP {response.status_code}", response.text)
                return None
        except Exception as e:
            self.log_result("PUT /api/stok-urun", False, f"Exception: {str(e)}")
            return None
    
    def test_stock_products_delete(self, product_id):
        """Test DELETE /api/stok-urun/{urun_id}"""
        print(f"🥫 Testing Stock Products - DELETE endpoint (ID: {product_id})...")
        try:
            response = self.session.delete(f"{BASE_URL}/stok-urun/{product_id}")
            if response.status_code == 200:
                self.log_result("DELETE /api/stok-urun", True, "Product deleted successfully")
                return True
            else:
                self.log_result("DELETE /api/stok-urun", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("DELETE /api/stok-urun", False, f"Exception: {str(e)}")
            return False
    
    def test_stock_count_status(self):
        """Test GET /api/stok-sayim/son-durum"""
        print("📊 Testing Stock Count - Latest Status endpoint...")
        try:
            response = self.session.get(f"{BASE_URL}/stok-sayim/son-durum")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    critical_items = [item for item in data if item.get("durum") == "kritik"]
                    self.log_result("GET /api/stok-sayim/son-durum", True, 
                                  f"Retrieved {len(data)} products, {len(critical_items)} critical")
                    return data
                else:
                    self.log_result("GET /api/stok-sayim/son-durum", False, "Response is not a list", data)
                    return []
            else:
                self.log_result("GET /api/stok-sayim/son-durum", False, f"HTTP {response.status_code}", response.text)
                return []
        except Exception as e:
            self.log_result("GET /api/stok-sayim/son-durum", False, f"Exception: {str(e)}")
            return []
    
    def test_stock_count_post(self, product_id):
        """Test POST /api/stok-sayim"""
        print("📊 Testing Stock Count - POST endpoint...")
        today = datetime.now().date().isoformat()
        count_data = {
            "urun_id": product_id,
            "miktar": 15.5,
            "tarih": today,
            "notlar": "Test count"
        }
        try:
            response = self.session.post(f"{BASE_URL}/stok-sayim?sayim_yapan_id=1", json=count_data)
            if response.status_code == 200:
                data = response.json()
                if (data.get("urun_id") == count_data["urun_id"] and 
                    data.get("miktar") == count_data["miktar"]):
                    self.log_result("POST /api/stok-sayim", True, f"Created count record with ID {data.get('id')}")
                    return data
                else:
                    self.log_result("POST /api/stok-sayim", False, "Created count data doesn't match", data)
                    return None
            else:
                self.log_result("POST /api/stok-sayim", False, f"HTTP {response.status_code}", response.text)
                return None
        except Exception as e:
            self.log_result("POST /api/stok-sayim", False, f"Exception: {str(e)}")
            return None
    
    def run_comprehensive_tests(self):
        """Run all stock management tests"""
        print("🚀 Starting Stock Management Backend API Tests")
        print("=" * 60)
        
        # Step 1: Authentication
        if not self.authenticate():
            print("❌ Authentication failed. Cannot proceed with tests.")
            return
        
        # Step 2: Test Stock Units
        print("\n📦 STOCK UNITS TESTING")
        print("-" * 30)
        
        # Get existing units
        existing_units = self.test_stock_units_get()
        
        # Create new unit
        new_unit = self.test_stock_units_post()
        
        # Test deletion validation (try to delete unit that's in use)
        if existing_units:
            # Try to delete first existing unit (should fail if in use)
            self.test_stock_units_delete(existing_units[0]["id"], should_fail=True)
        
        # Delete the unit we created (should succeed)
        if new_unit:
            self.test_stock_units_delete(new_unit["id"], should_fail=False)
        
        # Step 3: Test Stock Products
        print("\n🥫 STOCK PRODUCTS TESTING")
        print("-" * 30)
        
        # Get existing products
        existing_products = self.test_stock_products_get()
        
        # Create new product (using existing unit ID)
        birim_id = existing_units[0]["id"] if existing_units else 1
        new_product = self.test_stock_products_post(birim_id)
        
        # Update the product we created
        if new_product:
            updated_product = self.test_stock_products_put(new_product["id"])
        
        # Delete the product we created
        if new_product:
            self.test_stock_products_delete(new_product["id"])
        
        # Step 4: Test Stock Count
        print("\n📊 STOCK COUNT TESTING")
        print("-" * 30)
        
        # Get latest stock status
        stock_status = self.test_stock_count_status()
        
        # Create stock count (using existing product)
        if existing_products:
            self.test_stock_count_post(existing_products[0]["id"])
        
        # Final Results
        print("\n" + "=" * 60)
        print("🏁 TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Passed: {self.test_results['passed']}")
        print(f"❌ Failed: {self.test_results['failed']}")
        
        if self.test_results["errors"]:
            print("\n🚨 FAILED TESTS:")
            for error in self.test_results["errors"]:
                print(f"   • {error}")
        
        success_rate = (self.test_results['passed'] / 
                       (self.test_results['passed'] + self.test_results['failed']) * 100)
        print(f"\n📈 Success Rate: {success_rate:.1f}%")
        
        return self.test_results

if __name__ == "__main__":
    tester = StockManagementTester()
    results = tester.run_comprehensive_tests()