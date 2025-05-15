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
  let cart = JSON.parse(localStorage.getItem("snaxsnack_cart")) || [];
  const cartCountElements = document.querySelectorAll(".cart-count");

  // Update cart count
  function updateCartCount() {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCountElements.forEach((el) => (el.textContent = totalItems));
  }

  // Add to cart functionality
  document.querySelectorAll(".add-to-cart").forEach((button) => {
    button.addEventListener("click", function () {
      const productName = this.getAttribute("data-product");
      const sizeSelect = this.parentElement.querySelector(".size-option");
      const selectedOption = sizeSelect.options[sizeSelect.selectedIndex];
      const size = selectedOption.value;
      const sizeText = selectedOption.text.split(" - ")[0];
      const priceText = selectedOption.text.split(" - ")[1];
      const price = parseInt(priceText.replace(/[^\d]/g, ""));

      // Generate unique ID for cart item
      const itemId = `${productName.replace(/\s+/g, "-")}-${size.replace(
        /\s+/g,
        "-"
      )}`.toLowerCase();

      // Check if item already exists in cart
      const existingItem = cart.find((item) => item.id === itemId);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({
          id: itemId,
          product: productName,
          size: size,
          sizeText: sizeText,
          price: price,
          quantity: 1,
          priceText: priceText,
        });
      }

      // Save to localStorage
      localStorage.setItem("snaxsnack_cart", JSON.stringify(cart));

      // Update cart count
      updateCartCount();

      // Show added feedback
      const originalText = this.textContent;
      this.textContent = "✓ Ditambahkan";
      this.style.backgroundColor = "#4CAF50";

      setTimeout(() => {
        this.textContent = originalText;
        this.style.backgroundColor = "var(--orange)";
      }, 1500);
    });
  });

  // Calculate total price of items in cart
  function calculateTotalPrice() {
    return cart.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
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

    console.log("Cart data:", cart); // Debugging line

    if (cart.length === 0) {
      cartEmpty.style.display = "flex";
      cartItems.style.display = "none";
      return;
    }

    cartEmpty.style.display = "none";
    cartItems.style.display = "block";

    // Clear existing rows
    cartTableBody.innerHTML = "";

    let totalPrice = 0;

    // Add each item to the table
    cart.forEach((item, index) => {
      const subtotal = item.price * item.quantity;
      totalPrice += subtotal;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>
          <div class="cart-item-info">
            <div class="cart-item-img" style="background-image: url('https://via.placeholder.com/100/FFD700/A86523?text=${encodeURIComponent(
              item.product.split(" ")[0]
            )}')"></div>
            <span class="cart-item-name">${item.product}</span>
          </div>
        </td>
        <td>${item.sizeText || item.size}</td>
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

    // Hitung grand total dengan diskon jika ada
    let grandTotal = totalPrice;
    if (appliedDiscount > 0) {
      grandTotal = totalPrice - (totalPrice * appliedDiscount) / 100;
    }

    // Update totals
    totalPriceElement.textContent = `Rp ${totalPrice.toLocaleString("id-ID")}`;
    grandTotalElement.textContent = `Rp ${grandTotal.toLocaleString("id-ID")}`;

    const discountRow = document.getElementById("discount-row");
    const discountAmountEl = document.getElementById("discount-amount");

    if (discountRow && discountAmountEl) {
      if (appliedDiscount > 0) {
        discountRow.style.display = "flex";
        const discountAmount = totalPrice - grandTotal;
        discountAmountEl.textContent = `Rp ${discountAmount.toLocaleString(
          "id-ID"
        )}`;
      } else {
        discountRow.style.display = "none";
      }
    }

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

  // Global state untuk diskon
  let appliedDiscount =
    parseInt(localStorage.getItem("snaxsnack_discount")) || 0;
  const validRedeemCode = "SNACK10";
  const discountPercentage = 10;

  // Redeem code handler
  function setupRedeemCode() {
    const redeemInput = document.getElementById("redeem-code");
    const applyRedeemButton = document.getElementById("apply-redeem");
    const redeemMessage = document.getElementById("redeem-message");

    if (!redeemInput || !applyRedeemButton || !redeemMessage) return;

    applyRedeemButton.addEventListener("click", function () {
      const enteredCode = redeemInput.value.trim().toUpperCase();

      if (enteredCode === validRedeemCode) {
        appliedDiscount = discountPercentage;
        localStorage.setItem("snaxsnack_discount", appliedDiscount);
        redeemMessage.style.color = "green";
        redeemMessage.textContent = `Kode berhasil diterapkan! Diskon ${appliedDiscount}%`;
      } else {
        appliedDiscount = 0;
        localStorage.removeItem("snaxsnack_discount");
        redeemMessage.style.color = "red";
        redeemMessage.textContent = "Kode tidak valid.";
      }

      if (appliedDiscount > 0) {
        redeemInput.value = validRedeemCode;
        redeemMessage.style.color = "green";
        redeemMessage.textContent = `Kode berhasil diterapkan! Diskon ${appliedDiscount}%`;
      }
      renderCartPage(); // Re-render cart
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
      // Format pesan WhatsApp langsung dari frontend
      let whatsappMessage = " *FORM PEMESANAN SNACKSNACK* \n\n";
      whatsappMessage += "================================\n\n";

      let total = 0;
      cartData.forEach((item) => {
        const subtotal = (item.price || 0) * (item.quantity || 1);
        total += subtotal;

        whatsappMessage += ` *${item.product || "Produk tidak diketahui"}*\n`;
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

      // Cek diskon
      const appliedDiscount =
        parseInt(localStorage.getItem("snaxsnack_discount")) || 0;

      if (appliedDiscount > 0) {
        const discountAmount = (total * appliedDiscount) / 100;
        const totalAfterDiscount = total - discountAmount;

        whatsappMessage += ` *Total Sebelum Diskon:* Rp ${total.toLocaleString(
          "id-ID"
        )}\n`;
        whatsappMessage += ` *Diskon (${appliedDiscount}%):* -Rp ${discountAmount.toLocaleString(
          "id-ID"
        )}\n`;
        whatsappMessage += ` *TOTAL PEMBAYARAN:* Rp ${totalAfterDiscount.toLocaleString(
          "id-ID"
        )}\n\n`;
      } else {
        whatsappMessage += ` *TOTAL PEMBAYARAN:* Rp ${total.toLocaleString(
          "id-ID"
        )}\n\n`;
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
      const whatsappUrl = `https://wa.me/6281295536876?text=${encodedMessage}`;

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

// Order success notification (tetap sama)
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
