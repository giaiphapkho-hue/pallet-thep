// Biến lưu trữ danh sách bài viết từ Contentful
let articlesData = [];

// Khởi tạo Swiper Carousel với tham số chuẩn responsive
const newsSwiper = new Swiper('.news-slider', {
  slidesPerView: 1,
  spaceBetween: 24,
  loop: false,
  grabCursor: true,
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
  breakpoints: {
    640: { slidesPerView: 2, spaceBetween: 20 },
    1024: { slidesPerView: 3, spaceBetween: 24 }
  }
});

// Hàm fetch danh sách bài viết từ Contentful REST API
async function loadContentfulArticles() {
  const SPACE_ID = 'pha3dwft82ap'; // Space ID của bạn
  const ACCESS_TOKEN = 'YOUR_CONTENTFUL_DELIVERY_TOKEN'; // Thay bằng Delivery API Token
  const url = `https://cdn.contentful.com/spaces/${SPACE_ID}/environments/master/entries?content_type=article&include=2&access_token=${ACCESS_TOKEN}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      articlesData = data.items;
      renderArticles(data);
    }
  } catch (error) {
    console.error("Lỗi tải bài viết từ Contentful:", error);
  }
}

// Render dữ liệu ra HTML
function renderArticles(data) {
  const container = document.getElementById('news-container');
  container.innerHTML = '';

  // Bảng ánh xạ Assets (Hình ảnh)
  const assetsMap = {};
  if (data.includes && data.includes.Asset) {
    data.includes.Asset.forEach(asset => {
      assetsMap[asset.sys.id] = asset.fields.file.url;
    });
  }

  data.items.forEach((item, index) => {
    const fields = item.fields;
    const title = fields.title || 'Bài viết chưa có tiêu đề';
    const excerpt = fields.excerpt || fields.summary || 'Bấm đọc tiếp để xem toàn bộ nội dung chi tiết...';
    
    // Lấy URL hình ảnh đại diện
    let imgUrl = 'https://via.placeholder.com/600x400?text=Hoa+Long+Mechanical';
    if (fields.featuredImage && fields.featuredImage.sys) {
      const assetId = fields.featuredImage.sys.id;
      if (assetsMap[assetId]) {
        imgUrl = 'https:' + assetsMap[assetId];
      }
    }

    const slideHTML = `
      <div class="swiper-slide">
        <div class="news-card">
          <div class="news-thumb">
            <img src="${imgUrl}" alt="${title}" loading="lazy">
          </div>
          <div class="news-info">
            <h3>${title}</h3>
            <p class="excerpt">${excerpt}</p>
            <button class="btn-read-more" onclick="openArticleModal('${item.sys.id}')">
              Đọc tiếp <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', slideHTML);
  });

  // Cập nhật lại Swiper slider sau khi load xong DOM
  newsSwiper.update();
}

// Hàm mở Popup đọc nội dung chi tiết
function openArticleModal(articleId) {
  const article = articlesData.find(item => item.sys.id === articleId);
  if (!article) return;

  const fields = article.fields;
  
  // Set tiêu đề & ngày đăng
  document.getElementById('modal-title').innerText = fields.title || '';
  const createdDate = new Date(article.sys.createdAt).toLocaleDateString('vi-VN');
  document.getElementById('modal-date').innerText = createdDate;

  // Render Rich Text / Body
  const contentContainer = document.getElementById('modal-content');
  if (typeof fields.content === 'string') {
    contentContainer.innerHTML = fields.content;
  } else if (fields.content && fields.content.nodeType === 'document') {
    // Nếu là dạng Contentful Rich Text Object
    contentContainer.innerHTML = parseRichTextToHTML(fields.content);
  } else {
    contentContainer.innerHTML = `<p>${fields.excerpt || 'Đang cập nhật nội dung...'}</p>`;
  }

  // Hiển thị modal
  const modal = document.getElementById('article-modal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden'; // Khóa scroll trang chính
}

// Hàm đóng Popup
function closeArticleModal() {
  const modal = document.getElementById('article-modal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

// Helper: Helper đơn giản parse Rich Text của Contentful ra HTML
function parseRichTextToHTML(richTextObj) {
  if (!richTextObj.content) return '';
  return richTextObj.content.map(node => {
    if (node.nodeType === 'paragraph') {
      const text = node.content.map(c => c.value || '').join('');
      return `<p>${text}</p>`;
    }
    if (node.nodeType === 'heading-2') {
      const text = node.content.map(c => c.value || '').join('');
      return `<h2>${text}</h2>`;
    }
    return '';
  }).join('');
}

// Khởi chạy khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', loadContentfulArticles);
