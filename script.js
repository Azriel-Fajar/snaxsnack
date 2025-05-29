// Tutup navbar saat klik di luar (khusus mobile)
document.addEventListener("click", function (e) {
  const nav = document.getElementById("nav");
  const hamburger = document.getElementById("hamburger");

  if (
    nav.classList.contains("active") &&
    !nav.contains(e.target) &&
    !hamburger.contains(e.target)
  ) {
    nav.classList.remove("active");
    hamburger.classList.remove("active");
  }
});

// Global variables
let cart = JSON.parse(localStorage.getItem("snaxsnack_cart")) || [];
let appliedDiscount = parseInt(localStorage.getItem("snaxsnack_discount")) || 0;

document.addEventListener("DOMContentLoaded", function () {
  // Mobile Menu Toggle
  const hamburger = document.getElementById("hamburger");
  const nav = document.getElementById("nav");

  if (hamburger && nav) {
    hamburger.addEventListener("click", function () {
      this.classList.toggle("active");
      nav.classList.toggle("active");
    });
  }

  // Close mobile menu when clicking on a link
  const navLinks = document.querySelectorAll("nav ul li a");
  navLinks.forEach((link) => {
    link.addEventListener("click", function () {
      if (window.innerWidth <= 768 && hamburger && nav) {
        hamburger.classList.remove("active");
        nav.classList.remove("active");
      }
    });
  });

  // Add active class to current section in navigation
  const sections = document.querySelectorAll("section");
  window.addEventListener("scroll", function () {
    let current = "";

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;

      if (pageYOffset >= sectionTop - 100) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("active");
      if (
        link.getAttribute("href") === `#${current}` ||
        (current === "" && link.getAttribute("href") === "index.html")
      ) {
        link.classList.add("active");
      }
    });
  });

  // Cart Functionality
  const cartCountElements = document.querySelectorAll(".cart-count");

  // Update cart count
  function updateCartCount() {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCountElements.forEach((el) => (el.textContent = totalItems));
  }

  // Fungsi untuk menampilkan efek checklist
  function showAddToCartFeedback(button) {
    const originalText = button.textContent;
    button.textContent = "✓ Ditambahkan";
    button.style.backgroundColor = "#4CAF50";

    setTimeout(() => {
      button.textContent = originalText;
      button.style.backgroundColor = "var(--orange)";
    }, 1500);
  }

  // Fungsi untuk menampilkan modal pilihan paket
  function showPackageOptions(button, productName, size, price, priceText) {
    const options = JSON.parse(button.getAttribute("data-options"));

    // Special case for Paket Huhah - no flavor selection needed
    if (productName === "Paket Huhah") {
      addToCart(productName, size, price, priceText, true, options);
      showAddToCartFeedback(button);
      return;
    }

    // Rest of the modal code remains the same for other packages
    const modal = document.createElement("div");
    modal.className = "package-modal";
    modal.innerHTML = `
    <div class="modal-content">
      <h3>Pilih Varian untuk ${productName}</h3>
      <div class="package-options">
        ${options
          .map((option) => {
            if (option.includes("Basreng") || option.includes("Makaroni")) {
              return `
              <div class="option-group">
                <label>${option}:</label>
                <select class="flavor-select" data-product="${option}">
                  <option value="${option} Pedas">Pedas</option>
                  <option value="${option} Asin">Asin</option>
                </select>
              </div>
            `;
            }
            return `<div class="option-item">${option}</div>`;
          })
          .join("")}
      </div>
      <div class="modal-buttons">
        <button class="cancel-package">Batal</button>
        <button class="confirm-package">Tambahkan ke Keranjang</button>
      </div>
    </div>
  `;

    document.body.appendChild(modal);

    modal.querySelector(".cancel-package").addEventListener("click", () => {
      modal.remove();
    });

    modal.querySelector(".confirm-package").addEventListener("click", () => {
      const selectedFlavors = Array.from(
        modal.querySelectorAll(".flavor-select")
      ).map((select) => select.value);
      const packageItems = options.map((option) => {
        if (option.includes("Basreng") || option.includes("Makaroni")) {
          const select = modal.querySelector(
            `select[data-product="${option}"]`
          );
          return select ? select.value : `${option} Pedas`;
        }
        return option;
      });

      addToCart(productName, size, price, priceText, true, packageItems);
      modal.remove();
      showAddToCartFeedback(button);
    });
  }

  // Fungsi untuk menambahkan ke keranjang
  function addToCart(
    productName,
    size,
    price,
    priceText,
    isPackage = false,
    packageItems = []
  ) {
    // Generate unique ID untuk item keranjang
    const itemId = `${productName.replace(/\s+/g, "-")}-${size.replace(
      /\s+/g,
      "-"
    )}`.toLowerCase();

    // Cek apakah item sudah ada di keranjang
    const existingItem = cart.find((item) => item.id === itemId);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: itemId,
        product: productName,
        size: size,
        price: price,
        quantity: 1,
        priceText: priceText,
        isPackage: isPackage,
        packageItems: packageItems,
        originalPrice: isPackage
          ? getOriginalPackagePrice(productName, size)
          : price,
      });
    }

    // Simpan ke localStorage
    localStorage.setItem("snaxsnack_cart", JSON.stringify(cart));
    updateCartCount();
  }

  // Fungsi untuk mendapatkan harga asli paket
  function getOriginalPackagePrice(packageName, size) {
    const packagePrices = {
      "Paket Kakap": { M: 54000, L: 91000 },
      "Paket Cihuy": { M: 32000, L: 53000 },
      "Paket Huhah": { M: 22000, L: 38000 },
      "Paket Gacor": { M: 26000, L: 45000 },
    };

    return packagePrices[packageName][size];
  }

  // Add to cart functionality
  document.querySelectorAll(".add-to-cart").forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      const productName = this.getAttribute("data-product");
      const isPackage = this.getAttribute("data-is-package") === "true";
      const sizeSelect = this.parentElement.querySelector(".size-option");
      const selectedOption = sizeSelect.options[sizeSelect.selectedIndex];
      const size = selectedOption.value;

      // Extract the discounted price (last price in the option text)
      const priceText = selectedOption.textContent.split("Rp ").pop().trim();
      const price = parseInt(priceText.replace(/[^\d]/g, ""));

      if (isPackage) {
        // Tampilkan modal pilihan untuk paket
        showPackageOptions(this, productName, size, price, priceText);
      } else {
        // Produk biasa langsung ditambahkan
        const sizeText = selectedOption.text.split(" - ")[0];
        addToCart(productName, size, price, priceText, false, []);
        showAddToCartFeedback(this);
      }
    });
  });

  // Calculate total price of items in cart
  function calculateTotalPrice() {
    let totalNonPackage = 0;
    let totalPackage = 0;

    cart.forEach((item) => {
      const subtotal = item.price * item.quantity;
      if (item.isPackage) {
        totalPackage += subtotal;
      } else {
        totalNonPackage += subtotal;
      }
    });

    return {
      totalNonPackage,
      totalPackage,
      grandTotal: totalNonPackage + totalPackage,
    };
  }

  // Cart Page Functionality
  function renderCartPage() {
    // Always get fresh data from localStorage
    cart = JSON.parse(localStorage.getItem("snaxsnack_cart")) || [];

    const cartTableBody = document.querySelector("#cart-table-body");
    const cartEmpty = document.querySelector("#cart-empty");
    const cartItems = document.querySelector("#cart-items");
    const totalPriceElement = document.querySelector("#total-price");
    const grandTotalElement = document.querySelector("#grand-total");
    const checkoutForm = document.getElementById("checkout-form");

    if (cart.length === 0) {
        cartEmpty.style.display = "flex";
        cartItems.style.display = "none";
        return;
    }

    cartEmpty.style.display = "none";
    cartItems.style.display = "block";

    // Clear existing rows
    cartTableBody.innerHTML = "";

    // Calculate totals
    const { totalNonPackage, totalPackage, grandTotal } = calculateTotalPrice();
    const totalPrice = totalNonPackage + totalPackage;

    // Hitung grand total dengan diskon hanya untuk non-paket
    let discountAmount = 0;
    let finalGrandTotal = grandTotal;

    if (appliedDiscount > 0) {
        discountAmount = (totalNonPackage * appliedDiscount) / 100;
        finalGrandTotal = totalPackage + (totalNonPackage - discountAmount);
    }

    // Add each item to the table
    cart.forEach((item, index) => {
        const subtotal = item.price * item.quantity;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>
                <div class="cart-item-info">
                    <div class="cart-item-img" style="background-image: url('https://via.placeholder.com/100/FFD700/A86523?text=${encodeURIComponent(
                        item.product.split(" ")[0]
                    )}')"></div>
                    <div>
                        <span class="cart-item-name">${item.product}</span>
                        ${
                            item.isPackage ? '<span class="package-badge">Paket</span>' : ""
                        }
                        ${
                            item.isPackage
                                ? `<div class="package-contents"><small>${item.packageItems.join(
                                    ", "
                                )}</small></div>`
                                : ""
                        }
                        ${
                            item.isPackage
                                ? `<div class="original-price-text"><small>Harga normal: Rp ${item.originalPrice.toLocaleString(
                                    "id-ID"
                                )}</small></div>`
                                : ""
                        }
                    </div>
                </div>
            </td>
            <td>${item.size}</td>
            <td>${item.priceText || `Rp ${item.price.toLocaleString("id-ID")}`}</td>
            <td>
                <div class="quantity-control">
                    <button class="decrease-qty" data-index="${index}">-</button>
                    <input type="number" value="${
                        item.quantity
                    }" min="1" class="item-qty" data-index="${index}">
                    <button class="increase-qty" data-index="${index}">+</button>
                </div>
            </td>
            <td>Rp ${subtotal.toLocaleString("id-ID")}</td>
            <td><button class="remove-item" data-index="${index}"><i class="fas fa-trash"></i></button></td>
        `;
        cartTableBody.appendChild(row);
    });

    // Update tampilan
    totalPriceElement.textContent = `Rp ${totalPrice.toLocaleString("id-ID")}`;
    grandTotalElement.textContent = `Rp ${finalGrandTotal.toLocaleString(
        "id-ID"
    )}`;

    const discountRow = document.getElementById("discount-row");
    const discountAmountEl = document.getElementById("discount-amount");

    if (discountRow && discountAmountEl) {
        if (appliedDiscount > 0) {
            discountRow.style.display = "flex";
            discountAmountEl.textContent = `-Rp ${discountAmount.toLocaleString(
                "id-ID"
            )} (${appliedDiscount}% untuk non-paket)`;
        } else {
            discountRow.style.display = "none";
        }
    }

    // Rest of the function remains the same...
    // Prepare cart data for form submission
    document.querySelector("#cart-data-input").value = JSON.stringify(cart);

    // Quantity controls
    document.querySelectorAll(".decrease-qty").forEach((button) => {
        button.addEventListener("click", function () {
            const index = parseInt(this.getAttribute("data-index"));
            if (cart[index].quantity > 1) {
                cart[index].quantity -= 1;
                saveAndRenderCart();
            }
        });
    });

    document.querySelectorAll(".increase-qty").forEach((button) => {
        button.addEventListener("click", function () {
            const index = parseInt(this.getAttribute("data-index"));
            cart[index].quantity += 1;
            saveAndRenderCart();
        });
    });

    document.querySelectorAll(".item-qty").forEach((input) => {
        input.addEventListener("change", function () {
            const index = parseInt(this.getAttribute("data-index"));
            const newQty = parseInt(this.value);
            if (newQty > 0) {
                cart[index].quantity = newQty;
                saveAndRenderCart();
            } else {
                this.value = cart[index].quantity;
            }
        });
    });

    // Event delegation for delete buttons
    cartTableBody.addEventListener("click", function (e) {
        if (e.target.closest(".remove-item")) {
            const index = parseInt(
                e.target.closest(".remove-item").getAttribute("data-index")
            );
            cart.splice(index, 1);
            saveAndRenderCart();
        }
    });

    // Form validation
    if (checkoutForm) {
        checkoutForm.addEventListener("submit", function (e) {
            const name = document.getElementById("name").value.trim();
            const phone = document.getElementById("phone").value.trim();
            const address = document.getElementById("address").value.trim();

            if (!name || !phone || !address) {
                e.preventDefault();
                alert(
                    "Harap lengkapi semua informasi yang diperlukan (Nama, Nomor WhatsApp, dan Alamat)"
                );
            }
        });
    }

    // Inisialisasi fitur kode redeem
    setupRedeemCode();
}

  // Redeem code handler
  function setupRedeemCode() {
    const redeemInput = document.getElementById("redeem-code");
    const applyRedeemButton = document.getElementById("apply-redeem");
    const redeemMessage = document.getElementById("redeem-message");

    if (!redeemInput || !applyRedeemButton || !redeemMessage) return;

    applyRedeemButton.addEventListener("click", function () {
      const enteredCode = redeemInput.value.trim().toUpperCase();

      if (enteredCode === "GACOR10") {
        appliedDiscount = 10;
        localStorage.setItem("snaxsnack_discount", appliedDiscount);
        redeemMessage.style.color = "green";
        redeemMessage.textContent = `Kode berhasil diterapkan! Diskon ${appliedDiscount}% (hanya untuk produk non-paket)`;
      } else {
        appliedDiscount = 0;
        localStorage.removeItem("snaxsnack_discount");
        redeemMessage.style.color = "red";
        redeemMessage.textContent = "Kode tidak valid.";
      }

      if (appliedDiscount > 0) {
        redeemInput.value = "GACOR10";
      }
      renderCartPage();
    });
  }

  function saveAndRenderCart() {
    localStorage.setItem("snaxsnack_cart", JSON.stringify(cart));
    updateCartCount();
    if (document.querySelector("#cart-table-body")) {
      renderCartPage();
    }
  }

  // Initialize cart count
  updateCartCount();

  // Render cart page if we're on cart.html
  if (window.location.pathname.includes("cart.html")) {
    renderCartPage();
  }

  // Sticky header on scroll
  const header = document.querySelector(".sticky-header");
  if (header) {
    window.addEventListener("scroll", function () {
      if (window.scrollY > 100) {
        header.style.boxShadow = "0 2px 15px rgba(0, 0, 0, 0.1)";
      } else {
        header.style.boxShadow = "none";
      }
    });
  }

  // Contact Form Submission
  const contactForm = document.getElementById("contact-form");

  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Ambil elemen
      const formStatus = document.getElementById("form-status");
      const submitButton = contactForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.textContent;

      // Reset status
      formStatus.style.display = "none";
      formStatus.textContent = "";

      // Ambil nilai input
      const name = document.getElementById("contact-name").value.trim();
      const email = document.getElementById("contact-email").value.trim();
      const subject =
        document.getElementById("contact-subject").value.trim() ||
        "Pesan dari Website";
      const message = document.getElementById("contact-message").value.trim();

      // Validasi
      if (!name || !email || !message) {
        showError("Harap isi semua field yang diperlukan");
        return;
      }

      // Validasi format email
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError("Email tidak valid");
        return;
      }

      // Kirim data
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("subject", subject);
      formData.append("message", message);
      formData.append("_replyto", email); // Untuk otomatis reply-to di Formspree

      // Loading state
      submitButton.textContent = "Mengirim...";
      submitButton.disabled = true;

      // Ganti dengan endpoint Formspree Anda
      fetch("https://formspree.io/f/manoqzeq", {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      })
        .then((response) => {
          if (response.ok) {
            showSuccess(
              "Pesan berhasil dikirim! Kami akan segera menghubungi Anda."
            );
            contactForm.reset();
          } else {
            throw new Error(`Error: ${response.status}`);
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          showError(
            "Terjadi kesalahan. Silakan coba lagi atau hubungi kami via WhatsApp."
          );
        })
        .finally(() => {
          submitButton.textContent = originalButtonText;
          submitButton.disabled = false;
        });
    });

    // Fungsi tampilkan error
    function showError(message) {
      const formStatus = document.getElementById("form-status");
      formStatus.textContent = message;
      formStatus.className = "form-status error";
      formStatus.style.display = "block";
    }

    // Fungsi tampilkan sukses
    function showSuccess(message) {
      const formStatus = document.getElementById("form-status");
      formStatus.textContent = message;
      formStatus.className = "form-status success";
      formStatus.style.display = "block";
    }
  }

  const scrollElements = document.querySelectorAll(".scroll-fade-up");

  function debounce(func, wait = 15, immediate = true) {
    let timeout;
    return function () {
      const context = this,
        args = arguments;
      const later = function () {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }

  function checkScroll() {
    const triggerBottom = window.innerHeight * 0.85;

    scrollElements.forEach((el, index) => {
      const boxTop = el.getBoundingClientRect().top;

      if (boxTop < triggerBottom && !el.classList.contains("visible")) {
        setTimeout(() => {
          el.classList.add("visible");
        }, index * 100); // delay animasi berdasarkan urutan
      }
    });
  }

  window.addEventListener("scroll", debounce(checkScroll));
  checkScroll();
});

// Function to prepare cart data before form submission
function prepareCartData() {
  // Ambil data dari localStorage
  const cartData = JSON.parse(localStorage.getItem("snaxsnack_cart")) || [];

  // Validasi data
  if (!Array.isArray(cartData)) {
    alert("Data keranjang tidak valid, silakan tambahkan produk kembali");
    return false;
  }

  // Format data untuk dikirim
  const formattedCart = cartData.map((item) => ({
    product: item.product || "Produk tidak diketahui",
    size: item.size || item.sizeText || "Ukuran tidak diketahui",
    price: item.price || 0,
    quantity: item.quantity || 1,
  }));

  // Set nilai input hidden
  document.getElementById("cart-data-input").value =
    JSON.stringify(formattedCart);

  // Tampilkan loading
  document.getElementById("loading-overlay").style.display = "flex";

  // Validasi keranjang tidak kosong
  if (formattedCart.length === 0) {
    alert("Keranjang Anda kosong. Silakan tambahkan produk terlebih dahulu.");
    document.getElementById("loading-overlay").style.display = "none";
    return false;
  }

  // Validasi form
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const address = document.getElementById("address").value.trim();

  if (!name || !phone || !address) {
    alert(
      "Harap lengkapi semua informasi yang diperlukan (Nama, Nomor WhatsApp, dan Alamat)"
    );
    document.getElementById("loading-overlay").style.display = "none";
    return false;
  }

  return true;
}

document
  .getElementById("checkout-form")
  ?.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Validasi form
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const address = document.getElementById("address").value.trim();

    if (!name || !phone || !address) {
      alert(
        "Harap lengkapi semua informasi yang diperlukan (Nama, Nomor WhatsApp, dan Alamat)"
      );
      return;
    }

    // Persiapkan data
    const cartData = JSON.parse(localStorage.getItem("snaxsnack_cart")) || [];
    if (cartData.length === 0) {
      alert("Keranjang Anda kosong. Silakan tambahkan produk terlebih dahulu.");
      return;
    }

    // Tampilkan loading
    document.getElementById("loading-overlay").style.display = "flex";

    try {
      // Format pesan WhatsApp
      let whatsappMessage = " *FORM PEMESANAN SNACKSNACK* \n\n";
      whatsappMessage += "================================\n\n";

      let totalNonPackage = 0;
      let totalPackage = 0;

      cart.forEach((item) => {
        const subtotal = (item.price || 0) * (item.quantity || 1);

        if (item.isPackage) {
          totalPackage += subtotal;
        } else {
          totalNonPackage += subtotal;
        }

        whatsappMessage += ` *${item.product || "Produk tidak diketahui"}*${
          item.isPackage ? " (PAKET)" : ""
        }\n`;
        whatsappMessage += `   - Ukuran: ${
          item.sizeText || item.size || "Ukuran tidak diketahui"
        }\n`;
        whatsappMessage += `   - Harga: Rp ${(item.price || 0).toLocaleString(
          "id-ID"
        )}\n`;
        whatsappMessage += `   - Jumlah: ${item.quantity || 1}\n`;
        whatsappMessage += `   - Subtotal: Rp ${subtotal.toLocaleString(
          "id-ID"
        )}\n\n`;
      });

      whatsappMessage += "================================\n";
      whatsappMessage += ` *Total Produk Non-Paket:* Rp ${totalNonPackage.toLocaleString(
        "id-ID"
      )}\n`;
      whatsappMessage += ` *Total Produk Paket:* Rp ${totalPackage.toLocaleString(
        "id-ID"
      )}\n`;

      if (appliedDiscount > 0) {
        const discountAmount = (totalNonPackage * appliedDiscount) / 100;
        const totalAfterDiscount = totalNonPackage - discountAmount;

        whatsappMessage += ` *Diskon (${appliedDiscount}% untuk non-paket):* -Rp ${discountAmount.toLocaleString(
          "id-ID"
        )}\n`;
        whatsappMessage += ` *Total Setelah Diskon:* Rp ${totalAfterDiscount.toLocaleString(
          "id-ID"
        )}\n`;
        whatsappMessage += ` *TOTAL PEMBAYARAN:* Rp ${(
          totalPackage + totalAfterDiscount
        ).toLocaleString("id-ID")}\n\n`;
      } else {
        whatsappMessage += ` *TOTAL PEMBAYARAN:* Rp ${(
          totalNonPackage + totalPackage
        ).toLocaleString("id-ID")}\n\n`;
      }

      whatsappMessage += " *DATA PEMESAN*\n";
      whatsappMessage += ` *Nama:* ${name}\n`;
      whatsappMessage += ` *No. HP:* ${phone}\n`;
      whatsappMessage += ` *Alamat:* ${address}\n`;
      whatsappMessage += document.getElementById("notes").value.trim()
        ? ` *Catatan:* ${document.getElementById("notes").value.trim()}\n`
        : "";
      whatsappMessage += "\nTerima kasih atas pesanannya!";

      // Encode untuk URL WhatsApp
      const encodedMessage = encodeURIComponent(whatsappMessage);
      const whatsappUrl = `https://wa.me/6285669522225?text=${encodedMessage}`;

      // Kosongkan keranjang dan diskon
      localStorage.removeItem("snaxsnack_cart");
      localStorage.removeItem("snaxsnack_discount");

      // Update cart count
      document
        .querySelectorAll(".cart-count")
        .forEach((el) => (el.textContent = "0"));

      // Redirect ke WhatsApp
      window.open(whatsappUrl, "_blank");

      // Redirect ulang ke halaman cart untuk notifikasi sukses
      window.location.href = "cart.html?order=success";
    } catch (error) {
      console.error("Error:", error);
      alert(
        "Terjadi kesalahan saat memproses pesanan. Silakan coba lagi atau hubungi kami via WhatsApp."
      );
    } finally {
      document.getElementById("loading-overlay").style.display = "none";
    }
  });

// Order success notification
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has("order") && urlParams.get("order") === "success") {
  const orderSuccess = document.createElement("div");
  orderSuccess.className = "order-success-notification";
  orderSuccess.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-check-circle"></i>
      <p>Pesanan berhasil dikirim! Tim kami akan segera menghubungi Anda.</p>
    </div>
  `;
  document.body.appendChild(orderSuccess);

  setTimeout(() => {
    orderSuccess.style.opacity = "0";
    setTimeout(() => orderSuccess.remove(), 300);
  }, 5000);
}
