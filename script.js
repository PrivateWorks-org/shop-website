document.addEventListener("DOMContentLoaded", () => {
  const cartIcon = document.querySelector(".cart-icon");
  const cart = document.querySelector(".cart");
  const cartClose = document.querySelector(".close");
  const cartContainer = document.querySelector(".cart-cont");
  const searchInput = document.getElementById("product-search");
  const items = Array.from(document.querySelectorAll(".item"));
  const optionOverlay = document.getElementById("option-overlay");
  const modalTitle = document.getElementById("modal-title");
  const modalBody = document.getElementById("modal-body");
  const modalCancel = document.getElementById("modal-cancel");
  const modalConfirm = document.getElementById("modal-confirm");
  const purchaseBtn = document.getElementById("purchase-btn");
  const checkoutModal = document.getElementById("checkout-modal");
  const sendOrder = document.getElementById("send-order");
  const cancelOrder = document.getElementById("cancel-order");

  const products = document.querySelectorAll(".item");
  const popup = document.getElementById("product-popup");
  const popupImages = document.getElementById("popup-images");
  const closePopup = document.getElementById("close-popup");

  if (popup && popupImages) {
    products.forEach((product) => {
      const image = product.querySelector("img");
      if (!image) return;

      const openPopup = () => {
        let images = [];
        const datasetImages = product.dataset.images || product.dataset.imges || "";

        try {
          const parsed = JSON.parse(datasetImages);
          if (Array.isArray(parsed) && parsed.length > 0) {
            images = parsed;
          }
        } catch (error) {
          images = [];
        }

        if (images.length === 0) {
          const src = image.getAttribute("src");
          if (src) {
            images = [src];
          }
        }

        popupImages.innerHTML = images
          .map((img) => `<img src="${img}" class="popup-image" alt="Product image">`)
          .join("");

        popup.style.display = "flex";
      };

      image.addEventListener("click", openPopup);
      product.addEventListener("click", (event) => {
        if (event.target === image) return;
        if (!event.target.closest(".add-to-cart") && !event.target.closest("button")) {
          openPopup();
        }
      });
    });
  }

  if (closePopup && popup) {
    closePopup.addEventListener("click", () => {
      popup.style.display = "none";
    });
  }


  // ======== WhatsApp Checkout ========
  const purchaseButton = document.getElementById("purchase-btn");

  let pendingProduct = null;

  if (cartIcon && cart) {
    cartIcon.addEventListener("click", () => cart.classList.add("active"));
  }

  if (cartClose && cart) {
    cartClose.addEventListener("click", () => cart.classList.remove("active"));
  }

  const addCartButtons = document.querySelectorAll(".add-to-cart");
  const totalPriceElement = document.querySelector(".total-price");
  const cartBadge = document.querySelector(".cart-count");
  const STORAGE_KEY = "alban-asal-cart";
  const PRODUCT_PRICES = {
    milk_kg: 44,
    milk_half_kg: 22,
    yogurt_half_kg: 20,
    eggs: "مخصص",
    cream: 20,
    croissant: 20,
    bread: 12,
    english_cake: 90,
    toast: 55,
    pancakes: 35,
    moshabaa: 70,
    fayesh: 70,
    boksmat: 70,
    pizza_roll: 80,
    trileche: 45,
    birthday_cake: "",
    rice_pudding: 20,
    ice_cream: "مخصص",
    fruit_cups: 35,
    pudding: 25,
    jelly: 20,
    custard: 25,
    cheesecake: 45,
    molten: 55,
    cheese_rom: "مخصص",
    lanshon: "مخصص",
    birthday_cake: "مخصص",
  };
  const EGG_PRICES = {
    white: 100,
    brown: 110,
    balady: 125,
  };
  const ICE_CREAM_PRICES = {
    chocolate: 25,
    vanilla: 25,
    mint: 30,
  };
  const CHEESE_WEIGHT_PRICES = {
    eighth: 20,
    quarter: 40,
    half: 100,
    kilo: 200,
  };
  const LANSHON_WEIGHT_PRICES = {
    eighth: 20,
    quarter: 45,
    half: 160,
    kilo: 250,
  };
  const CAKE_SIZE_PRICE = {
    small: 320,
    meidum: 390,
    large: 600,
    extra_large: 1000,
  };

  function formatPrice(price) {
    return price === "" || price === null || price === undefined
      ? "السعر: "
      : `السعر: ${price}`;
  }

  function syncProductPrices() {
    items.forEach((item) => {
      const priceId = item.dataset.priceId;
      if (!priceId || !(priceId in PRODUCT_PRICES)) return;

      const price = PRODUCT_PRICES[priceId];
      item.dataset.price = price;

      const priceElement = item.querySelector(".price");
      if (priceElement) {
        priceElement.textContent = formatPrice(price);
      }
    });
  }

  function saveCartToStorage() {
    if (!cartContainer) return;

    const items = Array.from(cartContainer.querySelectorAll(".cart-box")).map(
      (box) => ({
        title:
          box.querySelector(".cart-product-title")?.textContent?.trim() || "",
        price: box.querySelector(".cart-price")?.textContent?.trim() || "",
        quantity:
          box.querySelector(".cart-quantity-number")?.textContent?.trim() ||
          "1",
        image: box.querySelector(".cart-image")?.getAttribute("src") || "",
      }),
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function attachCartBoxEvents(cartBox) {
    const minusButton = cartBox.querySelector(".cart-quantity-minus");
    const plusButton = cartBox.querySelector(".cart-quantity-plus");
    const quantityElement = cartBox.querySelector(".cart-quantity-number");
    const deleteButton = cartBox.querySelector(".delete-item");

    minusButton?.addEventListener("click", () => {
      let quantity = parseInt(quantityElement?.textContent || "1", 10) || 1;
      if (quantity > 1) {
        quantity -= 1;
        if (quantityElement) {
          quantityElement.textContent = quantity;
        }
        updateTotal();
        saveCartToStorage();
      }
    });

    plusButton?.addEventListener("click", () => {
      let quantity = parseInt(quantityElement?.textContent || "1", 10) || 1;
      quantity += 1;
      if (quantityElement) {
        quantityElement.textContent = quantity;
      }
      updateTotal();
      saveCartToStorage();
    });

    deleteButton?.addEventListener("click", () => {
      cartBox.remove();
      updateTotal();
      saveCartToStorage();
    });
  }

  function restoreCartFromStorage() {
    if (!cartContainer) return;

    try {
      const savedCart = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(savedCart)) return;

      cartContainer.innerHTML = "";
      savedCart.forEach((item) => {
        const cartBox = document.createElement("div");
        cartBox.className = "cart-box";
        cartBox.innerHTML = `
          <img src="${item.image || ""}" class="cart-image" alt="${item.title || "منتج"}" />
          <div class="cart-details">
            <h2 class="cart-product-title">${item.title || "منتج"}</h2>
            <span class="cart-price">${item.price || ""}</span>
            <div class="cart-quantity">
              <button class="cart-quantity-minus" type="button">-</button>
              <span class="cart-quantity-number">${item.quantity || 1}</span>
              <button class="cart-quantity-plus" type="button">+</button>
            </div>
          </div>
          <div class="delete-item">
            <img src="delete-bin-6-line.png" class="delete-item-icon" alt="Delete item" />
          </div>
        `;

        cartContainer.appendChild(cartBox);
        attachCartBoxEvents(cartBox);
      });
    } catch (error) {
      console.error("Unable to restore cart", error);
    }

    updateTotal();
  }

  syncProductPrices();
  updateTotal();
  restoreCartFromStorage();

  function updateTotal() {
    if (!cartContainer || !totalPriceElement) return;

    let total = 0;
    const cartItems = cartContainer.querySelectorAll(".cart-box");

    cartItems.forEach((item) => {
      const priceText = item.querySelector(".cart-price")?.textContent || "";
      const quantityText =
        item.querySelector(".cart-quantity-number")?.textContent || "1";
      const priceNumber = Number.parseFloat(priceText.replace(/[^0-9.]/g, ""));
      const quantity = Number.parseInt(quantityText, 10) || 1;

      if (!Number.isNaN(priceNumber)) {
        total += priceNumber * quantity;
      }
    });

    totalPriceElement.textContent = `${total.toFixed(0)} جنيه`;

    const itemCount = cartContainer?.querySelectorAll(".cart-box").length || 0;
    if (cartBadge) {
      cartBadge.textContent = itemCount;
      cartBadge.style.visibility = itemCount > 0 ? "visible" : "hidden";
    }
  }

  function filterProducts(query) {
    const normalizedQuery = query.trim().toLowerCase();

    items.forEach((item) => {
      const text =
        (item.dataset.name || "") +
        " " +
        (item.querySelector("h2")?.textContent || "") +
        " " +
        (item.querySelector("p")?.textContent || "");
      const haystack = text.toLowerCase();
      const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
      const matches = tokens.every((token) => haystack.includes(token));

      item.style.display = matches || normalizedQuery === "" ? "block" : "none";
    });
  }

  function resetOptionModal() {
    pendingProduct = null;
    if (optionOverlay) {
      optionOverlay.classList.remove("show");
      optionOverlay.setAttribute("aria-hidden", "true");
    }
    if (modalBody) {
      modalBody.innerHTML = "";
    }
  }

  function openEggOptionModal(productBox) {
    if (!optionOverlay || !modalTitle || !modalBody) return;

    pendingProduct = productBox;
    modalTitle.textContent = "اختر نوع البيض";
    modalBody.innerHTML = `
      <div class="option-list">
        <label class="option-item"><input type="radio" name="egg-option" value="white" checked /> أبيض - ${EGG_PRICES.white} جنيه</label>
        <label class="option-item"><input type="radio" name="egg-option" value="brown" /> بني - ${EGG_PRICES.brown} جنيه</label>
        <label class="option-item"><input type="radio" name="egg-option" value="balady" /> بلدي - ${EGG_PRICES.balady} جنيه</label>
      </div>
    `;

    optionOverlay.classList.add("show");
    optionOverlay.setAttribute("aria-hidden", "false");
  }

  function openIceCreamOptionModal(productBox) {
    if (!optionOverlay || !modalTitle || !modalBody) return;

    pendingProduct = productBox;
    modalTitle.textContent = "اختر نكهة الآيس كريم";
    modalBody.innerHTML = `
      <div class="option-list">
        <label class="option-item"><input type="radio" name="ice-cream-option" value="chocolate" checked /> شوكولاتة - ${ICE_CREAM_PRICES.chocolate} جنيه</label>
        <label class="option-item"><input type="radio" name="ice-cream-option" value="vanilla" /> فانيليا - ${ICE_CREAM_PRICES.vanilla} جنيه</label>
        <label class="option-item"><input type="radio" name="ice-cream-option" value="mint" /> نعناع - ${ICE_CREAM_PRICES.mint} جنيه</label>
      </div>
    `;

    optionOverlay.classList.add("show");
    optionOverlay.setAttribute("aria-hidden", "false");
  }

  function openCheeseOptionModal(productBox) {
    if (!optionOverlay || !modalTitle || !modalBody) return;

    pendingProduct = productBox;
    modalTitle.textContent = "اختر وزن الجبن";
    modalBody.innerHTML = `
      <div class="option-list">
        <label class="option-item"><input type="radio" name="cheese-weight-option" value="eighth" checked /> ثمن - ${CHEESE_WEIGHT_PRICES.eighth} جنيه</label>
        <label class="option-item"><input type="radio" name="cheese-weight-option" value="quarter" /> ربع - ${CHEESE_WEIGHT_PRICES.quarter} جنيه</label>
        <label class="option-item"><input type="radio" name="cheese-weight-option" value="half" /> نصف - ${CHEESE_WEIGHT_PRICES.half} جنيه</label>
        <label class="option-item"><input type="radio" name="cheese-weight-option" value="kilo" /> كيلو - ${CHEESE_WEIGHT_PRICES.kilo} جنيه</label>
      </div>
    `;

    optionOverlay.classList.add("show");
    optionOverlay.setAttribute("aria-hidden", "false");
  }

  function openLanshonOptionModal(productBox) {
    if (!optionOverlay || !modalTitle || !modalBody) return;

    pendingProduct = productBox;
    modalTitle.textContent = "اختر وزن اللانشون";
    modalBody.innerHTML = `
      <div class="option-list">
        <label class="option-item"><input type="radio" name="lanshon-weight-option" value="eighth" checked /> ثمن - ${LANSHON_WEIGHT_PRICES.eighth} جنيه</label>
        <label class="option-item"><input type="radio" name="lanshon-weight-option" value="quarter" /> ربع - ${LANSHON_WEIGHT_PRICES.quarter} جنيه</label>
        <label class="option-item"><input type="radio" name="lanshon-weight-option" value="half" /> نصف - ${LANSHON_WEIGHT_PRICES.half} جنيه</label>
        <label class="option-item"><input type="radio" name="lanshon-weight-option" value="kilo" /> كيلو - ${LANSHON_WEIGHT_PRICES.kilo} جنيه</label>
      </div>
    `;

    optionOverlay.classList.add("show");
    optionOverlay.setAttribute("aria-hidden", "false");
  }

  function openCakeOptionModal(productBox) {
    if (!optionOverlay || !modalTitle || !modalBody) return;

    pendingProduct = productBox;
    modalTitle.textContent = "اختر حجم التورتة";
    modalBody.innerHTML = `
      <div class="option-list">
        <label class="option-item"><input type="radio" name="cake-size-price" value="small" checked /> صغيرة 20*20 - ${CAKE_SIZE_PRICE.small} جنيه</label>
        <label class="option-item"><input type="radio" name="cake-size-price" value="meidum" /> متوسطة 30*30 - ${CAKE_SIZE_PRICE.meidum} جنيه</label>
        <label class="option-item"><input type="radio" name="cake-size-price" value="large" />كبيرة 40*40 - ${CAKE_SIZE_PRICE.large} جنيه</label>
        <label class="option-item"><input type="radio" name="cake-size-price" value="extra_large" /> كبيرة جدا 50*50 - ${CAKE_SIZE_PRICE.extra_large} جنيه</label>
        <p>ملاحظة : يمكنك كتابة تفاصيل التورتة (شكل / نكهة) عند قسم الملاحظات عند الطلب</p>
      </div>
    `;

    optionOverlay.classList.add("show");
    optionOverlay.setAttribute("aria-hidden", "false");
  }

  searchInput?.addEventListener("input", (event) => {
    filterProducts(event.target.value);
  });

  modalCancel?.addEventListener("click", resetOptionModal);
  optionOverlay?.addEventListener("click", (event) => {
    if (event.target === optionOverlay) {
      resetOptionModal();
    }
  });

  modalConfirm?.addEventListener("click", () => {
    if (!pendingProduct) return;

    if (pendingProduct.dataset.custom === "ice-cream-flavor") {
      const selectedOption = modalBody?.querySelector(
        'input[name="ice-cream-option"]:checked',
      );
      const optionValue = selectedOption?.value || "chocolate";
      const optionLabel =
        optionValue === "vanilla"
          ? "فانيليا"
          : optionValue === "mint"
            ? "نعناع"
            : "شوكولاتة";
      const optionPrice =
        ICE_CREAM_PRICES[optionValue] || ICE_CREAM_PRICES.chocolate;

      addToCart(pendingProduct, cartContainer, cart, optionLabel, optionPrice);
      resetOptionModal();
      return;
    }

    if (pendingProduct.dataset.custom === "cheese_weight_prices") {
      const selectedOption = modalBody?.querySelector(
        'input[name="cheese-weight-option"]:checked',
      );
      const optionValue = selectedOption?.value || "eighth";
      const optionLabel =
        optionValue === "quarter"
          ? "ربع"
          : optionValue === "half"
            ? "نصف"
            : optionValue === "kilo"
              ? "كيلو"
              : "ثمن";
      const optionPrice =
        CHEESE_WEIGHT_PRICES[optionValue] || CHEESE_WEIGHT_PRICES.eighth;

      addToCart(pendingProduct, cartContainer, cart, optionLabel, optionPrice);
      resetOptionModal();
      return;
    }

    if (pendingProduct.dataset.custom === "lanshon_weight_prices") {
      const selectedOption = modalBody?.querySelector(
        'input[name="lanshon-weight-option"]:checked',
      );
      const optionValue = selectedOption?.value || "eighth";
      const optionLabel =
        optionValue === "quarter"
          ? "ربع"
          : optionValue === "half"
            ? "نصف"
            : optionValue === "kilo"
              ? "كيلو"
              : "ثمن";
      const optionPrice =
        LANSHON_WEIGHT_PRICES[optionValue] || LANSHON_WEIGHT_PRICES.eighth;

      addToCart(pendingProduct, cartContainer, cart, optionLabel, optionPrice);
      resetOptionModal();
      return;
    }

    if (pendingProduct.dataset.custom === "cake_size_price") {
      const selectedOption = modalBody?.querySelector(
        'input[name="cake-size-price"]:checked',
      );
      const optionValue = selectedOption?.value || "small";
      const optionLabel =
        optionValue === "meidum"
          ? "وسط"
          : optionValue === "large"
            ? "كبيرة"
            : optionValue === "extra_large"
              ? "كبيرة جدا"
              : "صغيرة";
      const optionPrice =
        CAKE_SIZE_PRICE[optionValue] || CAKE_SIZE_PRICE.eighth;

      addToCart(pendingProduct, cartContainer, cart, optionLabel, optionPrice);
      resetOptionModal();
      return;
    }

    const selectedOption = modalBody?.querySelector(
      'input[name="egg-option"]:checked',
    );
    const optionValue = selectedOption?.value || "white";
    const optionLabel =
      optionValue === "brown"
        ? "بني"
        : optionValue === "balady"
          ? "بلدي"
          : "أبيض";
    const optionPrice = EGG_PRICES[optionValue] || EGG_PRICES.white;

    addToCart(pendingProduct, cartContainer, cart, optionLabel, optionPrice);
    resetOptionModal();
  });

  addCartButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      const productBox = event.target.closest(".item");
      if (!productBox) return;

      if (productBox.dataset.custom === "egg-color") {
        openEggOptionModal(productBox);
        return;
      }

      if (productBox.dataset.custom === "ice-cream-flavor") {
        openIceCreamOptionModal(productBox);
        return;
      }

      if (productBox.dataset.custom === "cheese_weight_prices") {
        openCheeseOptionModal(productBox);
        return;
      }

      if (productBox.dataset.custom === "lanshon_weight_prices") {
        openLanshonOptionModal(productBox);
        return;
      }

      if (productBox.dataset.custom === "cake_size_price") {
        openCakeOptionModal(productBox);
        return;
      }

      addToCart(productBox, cartContainer, cart);
    });
  });

  function addToCart(
    productBox,
    cartContainer,
    cart,
    selectedOption = null,
    selectedPrice = null,
  ) {
    const productImage = productBox.querySelector("img")?.src || "";
    const productTitle = productBox.querySelector("h2")?.textContent || "منتج";
    const basePriceText = productBox.querySelector(".price")?.textContent || "";
    const productPrice =
      selectedPrice !== null ? `السعر: ${selectedPrice}` : basePriceText;
    const displayTitle = selectedOption
      ? `${productTitle} (${selectedOption})`
      : productTitle;

    const existingItems =
      cartContainer?.querySelectorAll(".cart-product-title") || [];
    for (const existingTitle of existingItems) {
      if (existingTitle.textContent === displayTitle) {
        alert("تم إضافة هذا المنتج بالفعل إلى السلة.");
        return;
      }
    }

    const cartBox = document.createElement("div");
    cartBox.className = "cart-box";
    cartBox.innerHTML = `
      <img src="${productImage}" class="cart-image" alt="${displayTitle}" />
      <div class="cart-details">
        <h2 class="cart-product-title">${displayTitle}</h2>
        <span class="cart-price">${productPrice}</span>
        <div class="cart-quantity">
          <button class="cart-quantity-minus" type="button">-</button>
          <span class="cart-quantity-number">1</span>
          <button class="cart-quantity-plus" type="button">+</button>
        </div>
      </div>
      <div class="delete-item">
        <img src="delete-bin-6-line.png" class="delete-item-icon" alt="Delete item" />
      </div>
    `;

    if (cartContainer) {
      cartContainer.appendChild(cartBox);
      cart?.classList.add("active");
    }

    updateTotal();
    attachCartBoxEvents(cartBox);
    saveCartToStorage();
  }

  purchaseBtn.addEventListener("click", () => {
    if (cartContainer.children.length === 0) {
      alert("السلة فارغة");

      return;
    }

    checkoutModal.classList.add("show");
  });

  cancelOrder.addEventListener("click", () => {
    checkoutModal.classList.remove("show");
  });

  const shopNumber = "+201117456729"; // Replace with your WhatsApp number

  sendOrder.addEventListener("click", () => {
    const name = document.getElementById("customer-name").value.trim();

    const phone = document.getElementById("customer-phone").value.trim();

    const address = document.getElementById("customer-address").value.trim();

    const notes = document.getElementById("customer-notes").value.trim();

    if (!name || !phone || !address) {
      alert("يرجى تعبئة جميع البيانات");

      return;
    }

    let total = 0;

    let message = ` *طلب جديد*       

*أسم العميل :*
${name}
*رقم الهاتف :*
${phone}
*العنوان :*
${address}
*ملاحظات :*
${notes || "-"}

-----------------------

`;

    const cartItems = cartContainer.querySelectorAll(".cart-box");

    cartItems.forEach((item, index) => {
      const title = item.querySelector(".cart-product-title").textContent;

      const quantity = item.querySelector(".cart-quantity-number").textContent;

      const price = parseFloat(
        item.querySelector(".cart-price").textContent.replace(/[^0-9.]/g, ""),
      );

      const subtotal = price * quantity;

      total += subtotal;

      message += `${index + 1}. ${title}

السعر: ${price} جنيه
الكمية: ${quantity}
الإجمالي: ${subtotal} جنيه

`;
      message += `
-----------------------
`;
    });

    message += `-----------------------

 الإجمالي:
${total} جنيه`;

    window.open(
      `https://wa.me/${shopNumber}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  });
});

const carousel = document.getElementById("carousel");

function scrollCarousel(direction) {
  const scrollAmount = 320; // Image width + gap
  carousel.scrollBy({
    left: direction * scrollAmount,
    behavior: "smooth",
  });
}
