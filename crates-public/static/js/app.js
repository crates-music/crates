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
    
    // Share functionality using Web Share API if available
    window.shareUrl = function(url, title, text) {
        if (navigator.share) {
            navigator.share({
                title: title,
                text: text,
                url: url
            }).catch(console.error);
        } else {
            // Fallback to copy to clipboard
            copyToClipboard(url);
        }
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