// Crates Public Sharing - JavaScript Utilities

// Add JSON template helper for Go templates
document.addEventListener('DOMContentLoaded', function() {
    // Setup any global functionality here
    
    // Copy to clipboard functionality
    window.copyToClipboard = function(text) {
        navigator.clipboard.writeText(text).then(function() {
            // You could show a toast notification here
            console.log('Copied to clipboard');
        }).catch(function(err) {
            console.error('Could not copy text: ', err);
        });
    };
    
    // Enhanced share functionality using Web Share API if available
    window.shareUrl = function(url, title, text) {
        if (navigator.share) {
            // Mobile: Use native share dialog
            navigator.share({
                title: title,
                text: text,
                url: url
            }).catch(console.error);
        } else {
            // Desktop: Copy to clipboard with visual feedback
            copyToClipboard(url);
            showShareToast('Link copied to clipboard!');
        }
    };
    
    // Show toast notification for desktop share feedback
    window.showShareToast = function(message) {
        // Remove any existing toast
        const existingToast = document.querySelector('.share-toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        // Create new toast
        const toast = document.createElement('div');
        toast.className = 'share-toast position-fixed top-0 start-50 translate-middle-x mt-3 px-3 py-2 bg-success text-white rounded shadow-lg';
        toast.style.zIndex = '9999';
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Animate in
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(() => {
            toast.style.transition = 'all 0.3s ease';
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    };
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        // ESC key to clear search
        if (e.key === 'Escape') {
            const searchInputs = document.querySelectorAll('input[type="text"]');
            searchInputs.forEach(input => {
                if (input.value && document.activeElement === input) {
                    input.value = '';
                    input.dispatchEvent(new Event('input'));
                }
            });
        }
    });
    
    // Lazy loading for images
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        });
        
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => imageObserver.observe(img));
    }
    
    // Add loading states to external links
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a[href^="https://open.spotify.com"]');
        if (link) {
            const icon = link.querySelector('.bi-spotify');
            if (icon) {
                icon.className = 'bi-arrow-clockwise spin';
                setTimeout(() => {
                    icon.className = 'bi-spotify text-success fs-5';
                }, 1000);
            }
        }
    });
});

// Utility function to format numbers
window.formatNumber = function(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
};

// Utility function to truncate text
window.truncateText = function(text, length) {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
};

// Add CSS for spinning animation
const style = document.createElement('style');
style.textContent = `
    .spin {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);