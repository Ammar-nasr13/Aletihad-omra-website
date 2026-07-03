document.addEventListener('DOMContentLoaded', function () {
  const data = {
    ihram: {
      title: 'الإحرام من الميقات',
      html: '<p>النية والإحرام عند المواقيت المخصصة (ميقات أهل المدينة: / ذو الحليفة، وغيرهم حسب المنطقة). اخلع الملابس المخيّلة للحرمة وارتدِ إحرام الرجال (إزار ورداء) واتبع أحكام الإحرام قبل دخول مكة.</p>'
    },
    tawaf: {
      title: 'الطواف',
      html: '<p>الطواف حول الكعبة سبعة أشواط يبدأ من الحجر الأسود. احرص على الترتيب والآداب والتلبية إن لزم الأمر. للطواف أحكام خاصة للرمي في الحج لكن في العمرة يكفي الطواف حول الكعبة.</p>'
    },
    maqam: {
      title: 'مقام إبراهيم',
      html: '<p>بعد الطواف، يُستحب الصلاة خلف مقام إبراهيم إن أمكن اقتداءً بالسنة، أو الدعاء وقراءة ما تيسر من القرآن.</p>'
    },
    saee: {
      title: 'السعي',
      html: '<p>السعي بين الصفا والمروة سبعة أشواط يبدأ بالصفا وينتهي بالمروة. اتبع التعليمات، واحرص على الهدوء والنظام واحترام الزوار.</p>'
    },
    zamzam: {
      title: 'زمزم',
      html: '<p>شرب ماء زمزم مستحب وبالقدر الذي يُرغَب فيه، مع الدعاء والنية. احترم قواعد المكان وتوجيهات العاملين.</p>'
    },
    halq: {
      title: 'الحلق أو التقصير',
      html: '<p>بعد إتمام المناسك الأساسية، يشرع للحاج أو المعتمر الحلق أو التقصير. الحلق للرجال، والتقصير تقصير الشعر للرجال والنساء. احرص على الصحة والنظافة.</p>'
    },

  };

  const modal = document.getElementById('manasekModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalContent = document.getElementById('modalContent');
  const closeBtn = document.querySelector('.modal-close');

  let activeTrigger = null;

  function openModal(key, trigger) {
    const item = data[key];
    if (!item) return;
    modalTitle.textContent = item.title;
    modalContent.innerHTML = item.html;
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (trigger) {
      activeTrigger = trigger;
      trigger.setAttribute('aria-expanded', 'true');
    }
    // move focus to the close button for keyboard users
    closeBtn.focus();
  }

  function closeModal() {
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (activeTrigger) {
      activeTrigger.setAttribute('aria-expanded', 'false');
      activeTrigger.focus();
      activeTrigger = null;
    }
  }

  document.querySelectorAll('.manasek-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-key');
      openModal(key, btn);
    });
  });

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  // Accessibility: close on ESC
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  // Lightbox functionality
  const lightbox = document.getElementById('imageLightbox');
  const lightboxImg = document.getElementById('lightboxImage');
  const lightboxClose = document.querySelector('.lightbox-close');
  const guideImage = document.querySelector('.guide-image');

  if (guideImage && lightbox && lightboxImg) {
    guideImage.addEventListener('click', function() {
      const img = guideImage.querySelector('img');
      if (img) {
        lightboxImg.src = img.src;
        lightbox.style.display = 'flex';
        // force reflow for transitions
        lightbox.offsetHeight;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });

    function closeLightbox() {
      lightbox.classList.remove('active');
      setTimeout(() => {
        lightbox.style.display = 'none';
        lightboxImg.src = '';
      }, 300);
      document.body.style.overflow = '';
    }

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function(e) {
      if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && lightbox.classList.contains('active')) {
        closeLightbox();
      }
    });
  }
});