const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://agricrop-project.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
  setupDate();
  setupSidebar();
  setupTasks();
  setupInteractiveMap();
  setupNotifications();
  setupDiseaseDetection();
  setupSoilMoisture();
  setupProfile();
  setupFieldMap();
  setupReports();
  setupAlerts();
  setupDashboard();
  setupWeatherWidget();
});

/**
 * Dynamically set the current date in the header
 */
function setupDate() {
  const dateEl = document.getElementById('current-date');
  if (!dateEl) return;

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const today = new Date();
  const dayName = days[today.getDay()];
  const dateNum = today.getDate();
  const monthName = months[today.getMonth()];
  const year = today.getFullYear();
  
  dateEl.textContent = `${dateNum} ${monthName} ${year}, ${dayName}`;
}

/**
 * Handle sidebar tab switching and active states
 */
function setupSidebar() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      const tabName = item.getAttribute('data-tab');
      if (tabName === 'logout') {
        localStorage.removeItem('token');
        showToast('Logging out of AgriCrop...');
        
        setTimeout(() => {
          const overlay = document.createElement('div');
          Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            backgroundColor: '#081d0f',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '9999',
            fontFamily: 'Outfit, sans-serif',
            textAlign: 'center'
          });
          
          overlay.innerHTML = `
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" stroke-width="2" style="margin-bottom: 20px;">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <h2 style="font-size: 28px; margin-bottom: 8px;">Logged Out</h2>
            <p style="color: #a3bfa8; font-size: 15px; padding: 0 20px;">You have been safely signed out. Click below to reconnect.</p>
            <button onclick="window.location.reload();" style="margin-top: 24px; background-color: #2ecc71; color: white; border: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; box-shadow: 0 4px 14px rgba(46, 204, 113, 0.3);">Reconnect</button>
          `;
          
          document.body.appendChild(overlay);
        }, 800);
        return;
      }
      
      // Remove active class from all items
      navItems.forEach(i => i.classList.remove('active'));
      
      // Add active class to clicked item
      item.classList.add('active');
      
      // Toggle tab content visibility
      const tabContents = document.querySelectorAll('.tab-content');
      tabContents.forEach(content => {
        content.classList.remove('active');
      });
      
      const targetTab = document.getElementById(`tab-${tabName}`);
      if (targetTab) {
        targetTab.classList.add('active');
      } else {
        // Fallback for coming soon tabs
        showToast(`${item.querySelector('span').innerText} is coming soon!`);
      }
      
      showToast(`Switched to ${item.querySelector('span').innerText} view`);
    });
  });
}

/**
 * Interactive checkmarks for Today's Tasks
 */
function setupTasks() {
  const checkboxes = [
    { id: 'chk-task-1', itemId: 'task-1', attentionCountChange: -1, healthyCountChange: 0 },
    { id: 'chk-task-2', itemId: 'task-2', criticalCountChange: -1, healthyCountChange: 0 },
    { id: 'chk-task-3', itemId: 'task-3', criticalCountChange: 0, healthyCountChange: 0 }
  ];

  checkboxes.forEach(config => {
    const chk = document.getElementById(config.id);
    const item = document.getElementById(config.itemId);
    
    if (chk && item) {
      chk.addEventListener('change', () => {
        if (chk.checked) {
          item.classList.add('completed');
          showToast(`Completed: ${item.querySelector('.task-title').innerText}`);
          
          // Adjust stats count slightly for interactive visual feedback
          if (config.attentionCountChange !== 0) {
            updateStat('stat-attention-count', config.attentionCountChange);
          }
          if (config.criticalCountChange !== 0) {
            updateStat('stat-critical-count', config.criticalCountChange);
          }
        } else {
          item.classList.remove('completed');
          
          // Reverse stat adjustment
          if (config.attentionCountChange !== 0) {
            updateStat('stat-attention-count', -config.attentionCountChange);
          }
          if (config.criticalCountChange !== 0) {
            updateStat('stat-critical-count', -config.criticalCountChange);
          }
        }
      });
    }
  });
}

function updateStat(elementId, change) {
  const el = document.getElementById(elementId);
  if (el) {
    let currentVal = parseInt(el.textContent, 10);
    if (!isNaN(currentVal)) {
      el.textContent = Math.max(0, currentVal + change);
    }
  }
}

/**
 * Setup Interactive Map: Hover effects, Tooltips, and Dual-Highlighting
 */
function setupInteractiveMap() {
  const mapPolygons = document.querySelectorAll('.map-field-polygon');
  const fieldItems = document.querySelectorAll('.field-item');
  const tooltip = document.getElementById('map-tooltip');
  const mapContainer = document.querySelector('.map-container');
  
  const fieldData = {
    '1': { title: 'Field 1', crop: 'Wheat • 5 Acres', status: 'Healthy', color: '#2ecc71' },
    '7': { title: 'Field 7', crop: 'Cotton • 4 Acres', status: 'Low Moisture', color: '#f1c40f' },
    '12': { title: 'Field 12', crop: 'Tomato • 6 Acres', status: 'Early Blight', color: '#e74c3c' },
    '18': { title: 'Field 18', crop: 'Maize • 10 Acres', status: 'Healthy', color: '#2ecc71' }
  };

  if (!mapContainer || !tooltip) return;

  // 1. Map Polygons Hover & Click
  mapPolygons.forEach(poly => {
    const fieldId = poly.getAttribute('data-field');
    const data = (window.mapFieldData && window.mapFieldData[fieldId]) || fieldData[fieldId];
    
    if (!data) return;

    poly.addEventListener('mouseenter', (e) => {
      // Highlight matching list item
      highlightListItem(fieldId, true);
      
      // Populate and show tooltip
      tooltip.querySelector('#tooltip-title').textContent = data.title;
      tooltip.querySelector('#tooltip-details').textContent = data.crop;
      
      const badge = tooltip.querySelector('#tooltip-badge');
      badge.textContent = data.status;
      badge.style.backgroundColor = data.color;
      badge.style.color = '#ffffff';
      
      tooltip.style.display = 'block';
    });

    poly.addEventListener('mousemove', (e) => {
      // Position tooltip relative to container boundaries
      const containerRect = mapContainer.getBoundingClientRect();
      const x = e.clientX - containerRect.left;
      const y = e.clientY - containerRect.top;
      
      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
    });

    poly.addEventListener('mouseleave', () => {
      highlightListItem(fieldId, false);
      tooltip.style.display = 'none';
    });

    poly.addEventListener('click', () => {
      showToast(`Selected ${data.title} (${data.crop})`);
    });
  });

  // 2. Field List Items Hover (triggers map polygon highlights)
  fieldItems.forEach(item => {
    const fieldId = item.getAttribute('data-field-id');
    const matchingPolygon = document.querySelector(`.map-field-polygon[data-field="${fieldId}"]`);
    
    if (!matchingPolygon) return;

    item.addEventListener('mouseenter', () => {
      item.classList.add('active-field');
      
      // Trigger SVG polygon hover state programmatically via a custom class or active class
      matchingPolygon.classList.add('active-polygon');
      if (fieldId === '1' || fieldId === '18') matchingPolygon.style.fillOpacity = '0.35';
      if (fieldId === '7') matchingPolygon.style.fillOpacity = '0.35';
      if (fieldId === '12') matchingPolygon.style.fillOpacity = '0.35';
    });

    item.addEventListener('mouseleave', () => {
      item.classList.remove('active-field');
      matchingPolygon.classList.remove('active-polygon');
      matchingPolygon.style.fillOpacity = ''; // resets to default stylesheet rule
    });
    
    item.addEventListener('click', () => {
      // Scroll to or highlight the map polygon
      showToast(`Viewing details for Field ${fieldId}`);
    });
  });

  function highlightListItem(id, active) {
    const item = document.querySelector(`.field-item[data-field-id="${id}"]`);
    if (item) {
      if (active) {
        item.classList.add('active-field');
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        item.classList.remove('active-field');
      }
    }
  }
}

/**
 * Handle notification panel toggling and dynamic alert fetching
 */
function setupNotifications() {
  const notifBtn = document.getElementById('btn-notification-bell');
  const badge = document.getElementById('bell-unread-count');
  const dropdown = document.getElementById('notification-dropdown');
  const dropdownList = document.getElementById('dropdown-alerts-list');
  const markAllReadBtn = document.getElementById('btn-mark-all-read');
  const viewAllLink = document.getElementById('link-view-all-alerts');

  if (!notifBtn) return;

  // Relative time helper
  function formatRelativeTime(dateStr) {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHrs = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHrs / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHrs < 24) return `${diffHrs}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays}d ago`;
    } catch (e) {
      return '';
    }
  }

  // Update badge and load dropdown alerts
  function updateUnreadBadge() {
    authFetch(`${API_BASE_URL}/api/alerts/unread-count`)
      .then(res => {
        if (!res.ok) throw new Error('Unread count fetch failed');
        return res.json();
      })
      .then(data => {
        const count = data.unread_count;
        if (badge) {
          if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'flex';
          } else {
            badge.style.display = 'none';
          }
        }
      })
      .catch(err => console.error('Error fetching unread count:', err));
  }

  // Populate dropdown list
  function loadDropdownAlerts() {
    if (!dropdownList) return;

    authFetch(`${API_BASE_URL}/api/alerts/recent?limit=5`)
      .then(res => {
        if (!res.ok) throw new Error('Recent alerts fetch failed');
        return res.json();
      })
      .then(alerts => {
        dropdownList.innerHTML = '';
        if (alerts.length === 0) {
          dropdownList.innerHTML = `
            <div class="no-alerts-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <p>No new notifications</p>
            </div>
          `;
          return;
        }

        alerts.forEach(alert => {
          const item = document.createElement('div');
          item.className = `dropdown-item ${alert.status === 'Unread' ? 'unread' : ''}`;
          
          let iconHtml = '';
          let bgClass = 'bg-green-tint';
          
          if (alert.type === 'Disease') {
            bgClass = 'bg-red-tint';
            iconHtml = `
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              </svg>
            `;
          } else if (alert.type === 'Moisture') {
            bgClass = 'bg-orange-tint';
            iconHtml = `
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
              </svg>
            `;
          } else if (alert.type === 'Weather') {
            bgClass = 'bg-orange-tint';
            iconHtml = `
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
              </svg>
            `;
          } else {
            bgClass = 'bg-green-tint';
            iconHtml = `
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            `;
          }

          item.innerHTML = `
            <div class="dropdown-item-icon ${bgClass}">
              ${iconHtml}
            </div>
            <div class="dropdown-item-content">
              <span class="dropdown-item-title">${alert.title}</span>
              <span class="dropdown-item-msg">${alert.message}</span>
              <span class="dropdown-item-time">${formatRelativeTime(alert.created_at)}</span>
            </div>
          `;

          item.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.remove('active');
            handleAlertClick(alert);
          });

          dropdownList.appendChild(item);
        });
      })
      .catch(err => console.error('Error fetching recent alerts:', err));
  }

  // Toggling dropdown
  notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isActive = dropdown.classList.contains('active');
    
    // Close other dropdowns if any
    document.querySelectorAll('.notification-dropdown').forEach(d => d.classList.remove('active'));

    if (!isActive) {
      dropdown.classList.add('active');
      loadDropdownAlerts();
    } else {
      dropdown.classList.remove('active');
    }
  });

  // Close dropdown on click outside
  document.addEventListener('click', (e) => {
    if (dropdown && !dropdown.contains(e.target) && e.target !== notifBtn) {
      dropdown.classList.remove('active');
    }
  });

  // Mark all read button
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      authFetch(`${API_BASE_URL}/api/alerts/recent?limit=100`)
        .then(res => res.json())
        .then(alerts => {
          const unreadAlerts = alerts.filter(a => a.status === 'Unread');
          if (unreadAlerts.length === 0) return;

          const promises = unreadAlerts.map(alert => 
            authFetch(`${API_BASE_URL}/api/alerts/${alert.id}/read`, { method: 'POST' })
          );

          Promise.all(promises)
            .then(() => {
              showToast('All notifications marked as read.');
              updateUnreadBadge();
              loadDropdownAlerts();
              if (typeof window.refreshAlertsFeed === 'function') {
                window.refreshAlertsFeed();
              }
            })
            .catch(err => console.error('Error marking all as read:', err));
        });
    });
  }

  // View All link
  if (viewAllLink) {
    viewAllLink.addEventListener('click', (e) => {
      e.preventDefault();
      dropdown.classList.remove('active');
      const alertsTab = document.querySelector('.nav-item[data-tab="alerts"]');
      if (alertsTab) {
        alertsTab.click();
      }
    });
  }

  // Run immediately and expose global update helper
  updateUnreadBadge();
  window.refreshNotifications = updateUnreadBadge;
}

/**
 * Handle notification alert item click
 */
function handleAlertClick(alert) {
  // 1. Mark alert as read
  if (alert.status === 'Unread') {
    authFetch(`${API_BASE_URL}/api/alerts/${alert.id}/read`, { method: 'POST' })
      .then(res => {
        if (res.ok) {
          if (typeof window.refreshNotifications === 'function') {
            window.refreshNotifications();
          }
          if (typeof window.refreshAlertsFeed === 'function') {
            window.refreshAlertsFeed();
          }
        }
      })
      .catch(err => console.error('Error marking alert as read:', err));
  }

  // 2. Redirect/focus logic
  if (alert.field_id) {
    const fieldId = alert.field_id;
    // Switch to map tab
    const navItem = document.querySelector('.nav-item[data-tab="map"]');
    if (navItem) {
      navItem.click();
    }

    showToast('Navigating to field map...');
    
    // We delay the highlight-and-drawer logic to ensure map components have finished loading/rendering
    setTimeout(() => {
      // Uncheck filter boxes or reset them if they exclude this card's category
      const filterCheckboxes = [
        document.getElementById('filter-healthy'),
        document.getElementById('filter-low'),
        document.getElementById('filter-suspected'),
        document.getElementById('filter-diseased')
      ];
      filterCheckboxes.forEach(chk => {
        if (chk && !chk.checked) {
          chk.checked = true;
          chk.dispatchEvent(new Event('change'));
        }
      });

      // Find the card
      const card = document.querySelector(`.field-card[data-field-id="${fieldId}"]`);
      if (card) {
        // Scroll into view
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Highlight pulse animation
        card.classList.add('highlight-pulse');
        // Trigger details drawer
        card.click();
        
        // Remove highlight pulse after 4.5 seconds (matches animation duration of 3 iterations * 1.5s)
        setTimeout(() => {
          card.classList.remove('highlight-pulse');
        }, 4500);
      } else {
        console.warn('Field card not found directly by ID on the DOM.');
      }
    }, 500);
  } else {
    // If there is no field_id, show message toast or navigate to appropriate tab
    if (alert.type === 'Weather') {
      const navItem = document.querySelector('.nav-item[data-tab="reports"]');
      if (navItem) navItem.click();
      showToast('Showing weather analytics recommendations.');
    } else {
      showToast(`Alert details: ${alert.message}`);
    }
  }
}

/**
 * Create a sleek premium toast notification system for user actions
 */
function showToast(message) {
  // Remove existing toast if present
  const existingToast = document.querySelector('.agri-toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = 'agri-toast';
  
  // Set inline styles for a premium design
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    backgroundColor: '#0f2c17',
    color: '#ffffff',
    padding: '12px 20px',
    borderRadius: '8px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    zIndex: '1000',
    fontFamily: 'Inter, sans-serif',
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderLeft: '4px solid #2ecc71',
    transform: 'translateY(100px)',
    opacity: '0',
    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  });

  toast.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #2ecc71;">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
    <span>${message}</span>
  `;

  document.body.appendChild(toast);

  // Trigger enter animation
  setTimeout(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  }, 50);

  // Trigger exit animation
  setTimeout(() => {
    toast.style.transform = 'translateY(20px)';
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}

/**
 * Setup Disease Detection: Upload simulation and history previews
 */
function setupDiseaseDetection() {
  const chooseFileBtn = document.getElementById('btn-choose-file');
  const fileInput = document.getElementById('leaf-file-input');
  const uploadArea = document.getElementById('upload-area');
  const scanOverlay = document.getElementById('scan-overlay');
  
  const resultContent = document.getElementById('result-content');
  const resultEmpty = document.getElementById('result-empty');
  
  const resultImg = document.getElementById('result-img');
  const resultDisease = document.getElementById('result-disease');
  const resultConfidence = document.getElementById('result-confidence');
  const resultRec = document.getElementById('result-recommendation');
  const btnScanAnother = document.getElementById('btn-scan-another');
  
  const recentCards = document.querySelectorAll('.recent-card');
  
  const diseaseData = {
    'early-blight': {
      title: 'Early Blight',
      confidence: '96.3%',
      recommendation: 'Remove infected leaves and apply appropriate fungicide.',
      image: '/assets/leaf_early_blight.png',
      class: 'val-danger'
    },
    'leaf-rust': {
      title: 'Leaf Rust',
      confidence: '93.1%',
      recommendation: 'Apply copper-based fungicide and ensure proper aeration.',
      image: '/assets/leaf_rust.png',
      class: 'val-warning'
    },
    'healthy': {
      title: 'Healthy',
      confidence: '98.7%',
      recommendation: 'No disease detected. Maintain regular irrigation and monitor.',
      image: '/assets/leaf_healthy.png',
      class: 'val-success'
    },
    'powdery-mildew': {
      title: 'Powdery Mildew',
      confidence: '91.4%',
      recommendation: 'Spray organic sulfur or neem oil. Reduce overhead watering.',
      image: '/assets/leaf_powdery_mildew.png',
      class: 'val-warning'
    }
  };

  if (!chooseFileBtn || !fileInput || !uploadArea || !scanOverlay) return;

  // Click handler to open file selector
  chooseFileBtn.addEventListener('click', () => {
    fileInput.click();
  });

  // Handle file selection (mock scanning trigger)
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      startScanningProcess();
    }
  });

  // Drag & drop support
  ['dragenter', 'dragover'].forEach(eventName => {
    uploadArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
    }, false);
  });

  uploadArea.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length) {
      fileInput.files = files;
      startScanningProcess();
    }
  });

  function startScanningProcess() {
    scanOverlay.style.display = 'flex';
    
    const formData = new FormData();
    const file = fileInput.files[0];
    if (file) {
      formData.append('file', file);
    } else {
      // Create a mock image file if no file was found in input
      const blob = new Blob(["mock content"], { type: "image/png" });
      formData.append('file', blob, "leaf_early_blight.png");
    }

    authFetch(`${API_BASE_URL}/api/disease/predict`, {
      method: 'POST',
      body: formData
    })
    .then(async response => {
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          // Response is not JSON
        }
        
        if (response.status === 503) {
          throw new Error("AI model not installed. Please contact the administrator.");
        }
        
        const msg = (errorData && errorData.detail) || (errorData && errorData.message) || (errorData && errorData.error) || `Server error (Status ${response.status})`;
        throw new Error(msg);
      }
      return response.json();
    })
    .then(data => {
      scanOverlay.style.display = 'none';
      
      const keyMap = {
        'Early Blight': 'early-blight',
        'Late Blight': 'late-blight',
        'Leaf Rust': 'leaf-rust',
        'Healthy': 'healthy',
        'Powdery Mildew': 'powdery-mildew',
        'Bacterial Spot': 'bacterial-spot'
      };
      const key = keyMap[data.disease] || data.disease.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      if (!diseaseData[key]) {
        let textClass = 'val-warning';
        if (data.disease === 'Healthy') {
          textClass = 'val-success';
        } else if (data.disease === 'Early Blight' || data.disease === 'Late Blight' || data.disease === 'Bacterial Spot') {
          textClass = 'val-danger';
        }
        
        diseaseData[key] = {
          title: data.disease,
          class: textClass,
          image: '/assets/leaf_early_blight.png'
        };
      }
      diseaseData[key].confidence = `${data.confidence}%`;
      diseaseData[key].recommendation = data.recommendation;
      
      // Load user uploaded file as image preview if available
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          diseaseData[key].image = e.target.result;
          loadScanResult(key);
        };
        reader.readAsDataURL(file);
      } else {
        loadScanResult(key);
      }
      
      recentCards.forEach(card => {
        card.classList.remove('active-card');
        if (card.getAttribute('data-disease-type') === key) {
          card.classList.add('active-card');
        }
      });
      
      showToast(`AI Diagnosis complete: ${data.disease}`);
      fetchDashboardData();
      if (window.refreshFieldMap) window.refreshFieldMap();
    })
    .catch(error => {
      console.error(error);
      scanOverlay.style.display = 'none';
      
      const errorMsg = error.message || 'An unknown error occurred during scanning.';
      showToast(`Scan Failed: ${errorMsg}`);
      
      // Update result panel with error message in a styled format
      resultContent.style.display = 'none';
      resultEmpty.style.display = 'flex';
      
      resultEmpty.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="1.5" style="width: 48px; height: 48px; margin-bottom: 12px; margin-top: 24px;">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p style="color: #e74c3c; font-size: 14px; font-weight: 500; text-align: center; max-width: 80%;">${errorMsg}</p>
        <button class="btn-scan-another" id="btn-scan-retry" style="margin-top: 16px; background-color: #2c3e50; border: none; padding: 8px 16px; border-radius: 6px; color: white; cursor: pointer; font-size: 13px;">Try Again</button>
      `;
      
      const btnRetry = document.getElementById('btn-scan-retry');
      if (btnRetry) {
        btnRetry.addEventListener('click', () => {
          resultEmpty.style.display = 'none';
          resultEmpty.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 48px; height: 48px; color: var(--text-muted); margin-bottom: 12px; margin-top: 24px;">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p style="color: var(--text-muted); font-size: 14px; text-align: center;">Upload a leaf image to see AI diagnostic prediction result.</p>
          `;
          fileInput.value = '';
          showToast('Ready for next scan');
        });
      }
    });
  }

  // Loading result details into card view
  function loadScanResult(key) {
    const data = diseaseData[key];
    if (!data) return;
    
    resultImg.src = data.image;
    resultDisease.textContent = data.title;
    resultConfidence.textContent = data.confidence;
    resultRec.textContent = data.recommendation;
    
    // Reset colors
    resultDisease.className = 'result-value val-disease';
    resultDisease.classList.add(data.class);
    
    // Toggle visible panels
    resultContent.style.display = 'block';
    resultEmpty.style.display = 'none';
  }

  // Scan another leaf (reset to empty view)
  if (btnScanAnother) {
    btnScanAnother.addEventListener('click', () => {
      resultContent.style.display = 'none';
      resultEmpty.style.display = 'flex';
      
      // Restore default empty state html in case it was modified by an error
      resultEmpty.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 48px; height: 48px; color: var(--text-muted); margin-bottom: 12px; margin-top: 24px;">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p style="color: var(--text-muted); font-size: 14px; text-align: center;">Upload a leaf image to see AI diagnostic prediction result.</p>
      `;
      
      fileInput.value = ''; // reset file input
      showToast('Ready for next scan');
    });
  }

  // Click on Recently Scanned cards
  recentCards.forEach(card => {
    card.addEventListener('click', () => {
      // Toggle active states
      recentCards.forEach(c => c.classList.remove('active-card'));
      card.classList.add('active-card');
      
      const key = card.getAttribute('data-disease-type');
      loadScanResult(key);
      showToast(`Viewing result for ${diseaseData[key].title}`);
    });
  });
}

/**
 * Setup Soil Moisture: Form predictions, Gauge animations, and Graph tooltips
 */
function setupSoilMoisture() {
  const tempInput = document.getElementById('input-temp');
  const btnRefreshTemp = document.getElementById('btn-refresh-temp');
  const humidityInput = document.getElementById('input-humidity');
  const rainfallInput = document.getElementById('input-rainfall');
  const currentMoistureInput = document.getElementById('input-current-moisture');
  const btnPredict = document.getElementById('btn-predict-moisture');
  
  const gaugeFill = document.getElementById('gauge-fill');
  const gaugeValue = document.getElementById('gauge-value');
  
  const recCallout = document.getElementById('soil-recommendation');
  const recText = document.getElementById('soil-rec-text');
  
  const chartNodes = document.querySelectorAll('.chart-node');
  const chartTooltip = document.getElementById('chart-tooltip');
  const trendContainer = document.querySelector('.trend-chart-container');

  if (!tempInput || !btnPredict || !gaugeFill || !gaugeValue) return;

  // Set default initial dial state to match mockup (18%)
  animateGauge(18);

  // Temperature randomizer
  if (btnRefreshTemp) {
    btnRefreshTemp.addEventListener('click', () => {
      const randTemp = Math.floor(Math.random() * (45 - 15 + 1)) + 15; // 15 to 45
      tempInput.value = randTemp;
      showToast(`Temperature set to ${randTemp}°C`);
      // Clear error if active
      validateField(tempInput, 0, 50, "Temperature");
    });
  }

  // Field validation helper
  function validateField(inputEl, min, max, name) {
    const valStr = inputEl.value.trim();
    const wrapper = inputEl.closest('.input-with-icon');
    const group = inputEl.closest('.form-group');
    
    // Clear previous errors
    if (wrapper) wrapper.classList.remove('has-error');
    const existingError = group ? group.querySelector('.error-message') : null;
    if (existingError) existingError.remove();
    
    if (valStr === "") {
      showError(wrapper, group, `${name} is required.`);
      return false;
    }
    
    const val = parseFloat(valStr);
    if (isNaN(val)) {
      showError(wrapper, group, `${name} must be a number.`);
      return false;
    }
    
    if (val < min || val > max) {
      showError(wrapper, group, `${name} must be between ${min} and ${max}.`);
      return false;
    }
    
    return true;
  }

  function showError(wrapper, group, message) {
    if (wrapper) wrapper.classList.add('has-error');
    if (group) {
      const errSpan = document.createElement('span');
      errSpan.className = 'error-message';
      errSpan.textContent = message;
      group.appendChild(errSpan);
    }
  }

  // Live input validation triggers
  tempInput.addEventListener('input', () => validateField(tempInput, 0, 50, "Temperature"));
  humidityInput.addEventListener('input', () => validateField(humidityInput, 0, 100, "Humidity"));
  rainfallInput.addEventListener('input', () => validateField(rainfallInput, 0, 500, "Rainfall"));
  currentMoistureInput.addEventListener('input', () => validateField(currentMoistureInput, 0, 100, "Current Soil Moisture"));

  // Predict moisture handler
  btnPredict.addEventListener('click', () => {
    // Validate all inputs before requesting prediction
    const isTempValid = validateField(tempInput, 0, 50, "Temperature");
    const isHumidityValid = validateField(humidityInput, 0, 100, "Humidity");
    const isRainfallValid = validateField(rainfallInput, 0, 500, "Rainfall");
    const isMoistureValid = validateField(currentMoistureInput, 0, 100, "Current Soil Moisture");
    
    if (!isTempValid || !isHumidityValid || !isRainfallValid || !isMoistureValid) {
      showToast("Please fix the validation errors before predicting.");
      return;
    }

    const temp = parseFloat(tempInput.value);
    const humidity = parseFloat(humidityInput.value);
    const rainfall = parseFloat(rainfallInput.value);
    const currentMoisture = parseFloat(currentMoistureInput.value);
    
    const payload = {
      temperature: temp,
      humidity: humidity,
      rainfall: rainfall,
      current_moisture: currentMoisture
    };

    showToast('Calculating soil moisture prediction...');

    authFetch(`${API_BASE_URL}/api/moisture/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Prediction API failed');
      }
      return response.json();
    })
    .then(data => {
      animateGauge(data.predicted_moisture);
      updateRecommendation(data.predicted_moisture);
      showToast(`Calculation complete. Soil Moisture predicted: ${data.predicted_moisture}%`);
      fetchDashboardData();
      if (window.refreshFieldMap) window.refreshFieldMap();
    })
    .catch(error => {
      console.error(error);
      showToast('API connection error. Using local fallback.');
      
      // Local fallback math formula
      let prediction = (currentMoisture * 0.75) + (rainfall * 0.4) - (temp * 0.15) + (humidity * 0.05);
      prediction = Math.min(95, Math.max(5, Math.round(prediction)));
      animateGauge(prediction);
      updateRecommendation(prediction);
      fetchDashboardData();
      if (window.refreshFieldMap) window.refreshFieldMap();
    });
  });

  function animateGauge(targetValue) {
    let currentCount = 0;
    const duration = 1000; // 1s
    const steps = 30;
    const increment = targetValue / steps;
    const stepTime = duration / steps;
    
    // Update SVG arc stroke color based on target
    if (targetValue < 30) {
      gaugeFill.setAttribute('stroke', '#ff9f43'); // Alert orange
    } else if (targetValue >= 30 && targetValue < 60) {
      gaugeFill.setAttribute('stroke', '#2ecc71'); // Healthy green
    } else {
      gaugeFill.setAttribute('stroke', '#1565c0'); // Highly saturated blue
    }

    const timer = setInterval(() => {
      currentCount += increment;
      if (currentCount >= targetValue) {
        currentCount = targetValue;
        clearInterval(timer);
      }
      
      const displayVal = Math.round(currentCount);
      gaugeValue.textContent = `${displayVal}%`;
      
      // Calculate SVG stroke offset: Arc length is 220px.
      // 0% filled => offset 220. 100% filled => offset 0.
      const offset = 220 - (currentCount / 100) * 220;
      gaugeFill.style.strokeDashoffset = offset;
    }, stepTime);
  }

  function updateRecommendation(value) {
    setTimeout(() => {
      if (value < 30) {
        recCallout.className = 'recommendation-callout alert-blue';
        recCallout.querySelector('h4').textContent = 'Irrigation Recommended';
        recText.textContent = 'Low moisture levels predicted. Irrigation is recommended within 24 hours.';
      } else if (value >= 30 && value < 60) {
        recCallout.className = 'recommendation-callout alert-green';
        recCallout.querySelector('h4').textContent = 'Moisture Levels Stable';
        recText.textContent = 'No immediate irrigation required. Soil moisture levels are within optimal range for growth.';
      } else {
        recCallout.className = 'recommendation-callout alert-amber';
        recCallout.querySelector('h4').textContent = 'Saturated Soil';
        recText.textContent = 'High moisture levels predicted. Soil is sufficiently saturated. Avoid irrigation to prevent waterlogging.';
      }
    }, 600);
  }

  // Interactive Graph nodes
  if (trendContainer && chartTooltip) {
    chartNodes.forEach(node => {
      node.addEventListener('mouseenter', () => {
        const val = node.getAttribute('data-val');
        const date = node.getAttribute('data-date');
        
        chartTooltip.querySelector('.tooltip-date').textContent = date;
        chartTooltip.querySelector('.tooltip-value').textContent = val;
        
        const nodeRect = node.getBoundingClientRect();
        const containerRect = trendContainer.getBoundingClientRect();
        
        // Align tooltip centered right above the node circle
        const x = nodeRect.left - containerRect.left + (nodeRect.width / 2);
        const y = nodeRect.top - containerRect.top;
        
        chartTooltip.style.left = `${x}px`;
        chartTooltip.style.top = `${y}px`;
        chartTooltip.style.display = 'block';
      });

      node.addEventListener('mouseleave', () => {
        chartTooltip.style.display = 'none';
      });
    });
  }
}

/**
 * Setup Profile Settings: Edit field states, Save settings, and Change password
 */
function setupProfile() {
  const btnEditProfile = document.getElementById('btn-edit-profile');
  const profileInputs = document.querySelectorAll('.profile-info-details .info-val-input');
  const welcomeHeader = document.querySelector('.welcome-message h1');
  const mainHeaderProfileName = document.querySelector('.profile-avatar + span'); // wait, let's see if we have a top header profile name
  
  // Password Modal elements
  const btnChangePwdTrigger = document.getElementById('btn-change-pwd-trigger');
  const pwdModal = document.getElementById('pwd-modal');
  const btnPwdModalClose = document.getElementById('btn-pwd-modal-close');
  const btnPwdModalCancel = document.getElementById('btn-pwd-modal-cancel');
  
  const btnUpdatePwd = document.getElementById('btn-update-pwd');
  const pwdOld = document.getElementById('prof-pwd-old');
  const pwdNew = document.getElementById('prof-pwd-new');
  const pwdConfirm = document.getElementById('prof-pwd-confirm');
  
  const btnAddField = document.getElementById('btn-add-field');

  let isEditing = false;

  if (!btnEditProfile) return;

  // Edit / Save Profile toggle
  btnEditProfile.addEventListener('click', () => {
    isEditing = !isEditing;
    
    if (isEditing) {
      // Toggle inputs to active editable state
      profileInputs.forEach(input => {
        input.removeAttribute('disabled');
      });
      
      btnEditProfile.textContent = 'Save Changes';
      btnEditProfile.classList.add('active-edit');
      showToast('Profile editing enabled');
      
      // Auto focus the name input
      const nameInput = document.getElementById('prof-name');
      if (nameInput) nameInput.focus();
    } else {
      // Save Changes clicked
      const nameInput = document.getElementById('prof-name');
      const newName = nameInput ? nameInput.value.trim() : '';
      
      if (!newName) {
        showToast('Name cannot be empty!');
        isEditing = true; // force keep editing
        return;
      }
      
      // Lock fields
      profileInputs.forEach(input => {
        input.setAttribute('disabled', 'true');
      });
      
      btnEditProfile.textContent = 'Edit Profile';
      btnEditProfile.classList.remove('active-edit');
      
      // Update names dynamically in UI headers
      if (welcomeHeader) {
        welcomeHeader.innerHTML = `Good Morning, ${newName}! <span class="emoji">🌱</span>`;
      }
      
      // Find name elements in app header (like Ramesh Kumar at the top right)
      const topHeaderNames = document.querySelectorAll('.header-meta .profile-avatar + span, .sidebar .profile-summary-name, h3#profile-summary-name');
      topHeaderNames.forEach(el => {
        el.textContent = newName;
      });
      
      showToast('Profile changes saved successfully!');
    }
  });

  // Modal Open
  if (btnChangePwdTrigger && pwdModal) {
    btnChangePwdTrigger.addEventListener('click', () => {
      pwdModal.classList.add('active');
      pwdOld.value = '';
      pwdNew.value = '';
      pwdConfirm.value = '';
      pwdOld.focus();
    });
  }

  // Modal Close functions
  function closePwdModal() {
    if (pwdModal) pwdModal.classList.remove('active');
  }

  if (btnPwdModalClose) {
    btnPwdModalClose.addEventListener('click', closePwdModal);
  }

  if (btnPwdModalCancel) {
    btnPwdModalCancel.addEventListener('click', closePwdModal);
  }

  // Change Password form handler
  if (btnUpdatePwd) {
    btnUpdatePwd.addEventListener('click', () => {
      const oldVal = pwdOld.value.trim();
      const newVal = pwdNew.value.trim();
      const confirmVal = pwdConfirm.value.trim();
      
      if (!oldVal || !newVal || !confirmVal) {
        showToast('Please fill in all password fields.');
        return;
      }
      
      if (newVal !== confirmVal) {
        showToast('New passwords do not match!');
        return;
      }
      
      closePwdModal();
      showToast('Password updated successfully!');
    });
  }

  // Add new field trigger
  const fieldModal = document.getElementById('field-modal');
  const btnFieldModalClose = document.getElementById('btn-field-modal-close');
  const btnFieldModalCancel = document.getElementById('btn-field-modal-cancel');
  const btnAddFieldSubmit = document.getElementById('btn-add-field-submit');
  
  const fieldNameInput = document.getElementById('field-modal-name');
  const fieldCropInput = document.getElementById('field-modal-crop');
  const fieldAreaInput = document.getElementById('field-modal-area');
  const fieldLocationInput = document.getElementById('field-modal-location');

  function closeFieldModal() {
    if (fieldModal) fieldModal.classList.remove('active');
  }

  if (btnAddField && fieldModal) {
    btnAddField.addEventListener('click', () => {
      fieldModal.classList.add('active');
      fieldNameInput.value = '';
      fieldCropInput.value = '';
      fieldAreaInput.value = '';
      fieldLocationInput.value = '';
      fieldNameInput.focus();
    });
  }

  if (btnFieldModalClose) btnFieldModalClose.addEventListener('click', closeFieldModal);
  if (btnFieldModalCancel) btnFieldModalCancel.addEventListener('click', closeFieldModal);

  if (btnAddFieldSubmit) {
    btnAddFieldSubmit.addEventListener('click', () => {
      const name = fieldNameInput.value.trim();
      const crop = fieldCropInput.value.trim();
      const areaVal = fieldAreaInput.value.trim();
      const locationText = fieldLocationInput.value.trim();

      if (!name || !crop || !areaVal || !locationText) {
        showToast('Please fill in all field inputs.');
        return;
      }

      const area = parseFloat(areaVal);
      if (isNaN(area) || area <= 0) {
        showToast('Area must be a positive number.');
        return;
      }

      // Geocoding location text to coordinates
      let latitude = 17.3850;
      let longitude = 78.4867;
      let resolvedLocation = locationText;

      // Check if user entered coordinates as comma separated values
      const coordRegex = /^(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)$/;
      const match = locationText.match(coordRegex);
      if (match) {
        latitude = parseFloat(match[1]);
        longitude = parseFloat(match[3]);
      } else {
        const lowerLoc = locationText.toLowerCase();
        if (lowerLoc.includes('sangareddy')) {
          latitude = 17.6193;
          longitude = 78.0805;
          resolvedLocation = 'Sangareddy';
        } else if (lowerLoc.includes('medak')) {
          latitude = 18.0484;
          longitude = 78.2616;
          resolvedLocation = 'Medak';
        } else if (lowerLoc.includes('zaheerabad')) {
          latitude = 17.6771;
          longitude = 77.5878;
          resolvedLocation = 'Zaheerabad';
        } else if (lowerLoc.includes('vikarabad')) {
          latitude = 17.3364;
          longitude = 77.9048;
          resolvedLocation = 'Vikarabad';
        } else if (lowerLoc.includes('hyderabad')) {
          latitude = 17.3850;
          longitude = 78.4867;
          resolvedLocation = 'Hyderabad';
        } else {
          // Generate slightly offset coordinates from Hyderabad to spread them on the map
          const offsetLat = (Math.random() - 0.5) * 0.15;
          const offsetLng = (Math.random() - 0.5) * 0.15;
          latitude = 17.3850 + offsetLat;
          longitude = 78.4867 + offsetLng;
        }
      }

      const payload = {
        field_name: name,
        crop: crop,
        area: area,
        latitude: latitude,
        longitude: longitude,
        status: 'Healthy',
        location: resolvedLocation
      };

      authFetch(`${API_BASE_URL}/api/fields`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      .then(res => {
        if (!res.ok) {
          return res.json().then(data => {
            throw new Error(data.detail || 'Failed to create field');
          });
        }
        return res.json();
      })
      .then(data => {
        showToast(`Field "${name}" successfully registered!`);
        closeFieldModal();
        fetchDashboardData();
      })
      .catch(err => {
        console.error(err);
        showToast(`Error adding field: ${err.message}`);
      });
    });
  }
}

/**
 * Setup Field Map: Dynamic blocks, details drawer, zooming and status filtering
 */
function setupFieldMap() {
  const btnZoomIn = document.getElementById('btn-map-zoom-in');
  const btnZoomOut = document.getElementById('btn-map-zoom-out');
  const btnLayers = document.getElementById('btn-map-layers');
  
  const mapGrid = document.getElementById('farm-map-grid');
  const filterPanel = document.getElementById('map-filter-panel');
  
  // Drawer elements
  const drawer = document.getElementById('field-drawer');
  const drawerBackdrop = document.getElementById('drawer-backdrop');
  const btnDrawerClose = document.getElementById('btn-drawer-close');
  
  const drawerFieldName = document.getElementById('drawer-field-name');
  const drawerCrop = document.getElementById('drawer-crop');
  const drawerArea = document.getElementById('drawer-area');
  const drawerLocation = document.getElementById('drawer-location');
  const drawerMoisture = document.getElementById('drawer-moisture');
  const drawerMoisturePct = document.getElementById('drawer-moisture-pct');
  const drawerMoistureFill = document.getElementById('drawer-moisture-fill');
  const drawerStatusBadge = document.getElementById('drawer-status-badge');
  const drawerDiseaseStatus = document.getElementById('drawer-disease-status');
  const drawerScanTime = document.getElementById('drawer-scan-time');
  const drawerAiRecommendation = document.getElementById('drawer-ai-recommendation');
  const drawerAiRecBox = document.getElementById('drawer-ai-rec-box');
  
  const drawerLoading = document.getElementById('drawer-loading');
  const drawerDetailsContent = document.getElementById('drawer-details-content');
  
  // Filter checkboxes
  const filterHealthy = document.getElementById('filter-healthy');
  const filterLow = document.getElementById('filter-low');
  const filterSuspected = document.getElementById('filter-suspected');
  const filterDiseased = document.getElementById('filter-diseased');
  
  if (!mapGrid) return;
  
  let gridCols = 3;
  let activeFilters = {
    healthy: true,
    low: true,
    suspected: true,
    diseased: true
  };
  
  // Apply grid columns
  function applyGridCols() {
    mapGrid.style.setProperty('--map-grid-cols', gridCols);
  }
  
  if (btnZoomIn) {
    btnZoomIn.addEventListener('click', () => {
      if (gridCols > 1) {
        gridCols--;
        applyGridCols();
        showToast(`Zoom level adjusted (fewer columns)`);
      }
    });
  }
  
  if (btnZoomOut) {
    btnZoomOut.addEventListener('click', () => {
      if (gridCols < 6) {
        gridCols++;
        applyGridCols();
        showToast(`Zoom level adjusted (more columns)`);
      }
    });
  }
  
  // Toggle filter panel
  if (btnLayers) {
    btnLayers.addEventListener('click', () => {
      filterPanel.classList.toggle('active');
    });
  }
  
  // Set up filter checkbox listeners
  const filterCheckboxes = [filterHealthy, filterLow, filterSuspected, filterDiseased];
  filterCheckboxes.forEach(chk => {
    if (chk) {
      chk.addEventListener('change', () => {
        const value = chk.value;
        const key = value === 'healthy' ? 'healthy' : (value === 'low moisture' ? 'low' : (value === 'suspected' ? 'suspected' : 'diseased'));
        activeFilters[key] = chk.checked;
        renderMapCards();
      });
    }
  });
  
  let fieldsCache = [];
  
  // Load fields dynamically
  function loadMapData() {
    authFetch(`${API_BASE_URL}/api/fields`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load fields');
        return res.json();
      })
      .then(fields => {
        fieldsCache = fields;
        updateMapMetrics(fields);
        renderMapCards();
      })
      .catch(err => {
        console.error(err);
        mapGrid.innerHTML = `
          <div style="grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; color: var(--text-muted);">
            <p>Error loading fields: ${err.message}</p>
          </div>
        `;
      });
  }
  
  // Update metrics panel
  function updateMapMetrics(fields) {
    const metricHealthy = document.getElementById('map-metric-healthy');
    const metricLow = document.getElementById('map-metric-low');
    const metricHigh = document.getElementById('map-metric-high');
    const metricCritical = document.getElementById('map-metric-critical');
    
    let healthyCount = 0;
    let lowCount = 0;
    let suspectedCount = 0;
    let diseasedCount = 0;
    
    fields.forEach(field => {
      const statusLower = field.status.toLowerCase();
      if (statusLower === 'healthy') {
        healthyCount++;
      } else if (statusLower.includes('moisture') || statusLower.includes('attention') || statusLower.includes('low')) {
        lowCount++;
      } else if (statusLower === 'disease suspected' || statusLower === 'suspected') {
        suspectedCount++;
      } else if (statusLower === 'high risk' || statusLower === 'diseased' || statusLower === 'infected') {
        diseasedCount++;
      } else {
        const cropLower = field.crop.toLowerCase();
        if (cropLower.includes('tomato') || cropLower.includes('pepper')) {
          diseasedCount++;
        } else {
          suspectedCount++;
        }
      }
    });
    
    if (metricHealthy) metricHealthy.textContent = healthyCount;
    if (metricLow) metricLow.textContent = lowCount;
    if (metricHigh) metricHigh.textContent = suspectedCount;
    if (metricCritical) metricCritical.textContent = diseasedCount;
  }
  
  // Render cards with filters
  function renderMapCards() {
    mapGrid.innerHTML = '';
    
    const filteredFields = fieldsCache.filter(field => {
      const statusLower = field.status.toLowerCase();
      if (statusLower === 'healthy') {
        return activeFilters.healthy;
      } else if (statusLower === 'disease suspected') {
        return activeFilters.suspected;
      } else if (statusLower === 'high risk' || statusLower === 'diseased' || statusLower === 'infected') {
        return activeFilters.diseased;
      } else if (statusLower.includes('moisture') || statusLower.includes('attention') || statusLower.includes('low')) {
        return activeFilters.low;
      } else {
        return true;
      }
    });
    
    if (filteredFields.length === 0) {
      mapGrid.innerHTML = `
        <div style="grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; color: var(--text-muted); font-weight: 500;">
          <p>No fields match the selected filters.</p>
        </div>
      `;
      return;
    }
    
    filteredFields.forEach(field => {
      const card = document.createElement('div');
      card.className = 'field-card';
      card.setAttribute('data-field-id', field.id);
      
      const statusLower = field.status.toLowerCase();
      let colorClass = 'card-healthy';
      let badgeClass = 'badge-healthy';
      let badgeIconHtml = '';
      
      if (statusLower === 'healthy') {
        colorClass = 'card-healthy';
        badgeClass = 'badge-healthy';
      } else if (statusLower === 'disease suspected') {
        colorClass = 'card-suspected';
        badgeClass = 'badge-attention';
        badgeIconHtml = `
          <svg class="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        `;
      } else if (statusLower === 'high risk' || statusLower === 'diseased' || statusLower === 'infected') {
        colorClass = 'card-diseased';
        badgeClass = 'badge-critical';
        badgeIconHtml = `
          <svg class="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          </svg>
        `;
      } else if (statusLower.includes('moisture') || statusLower.includes('attention') || statusLower.includes('low')) {
        colorClass = 'card-low-moisture';
        badgeClass = 'badge-attention';
        badgeIconHtml = `
          <svg class="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
          </svg>
        `;
      } else {
        colorClass = 'card-healthy';
        badgeClass = 'badge-healthy';
      }
      
      card.classList.add(colorClass);
      
      const moistureDisplay = field.current_moisture !== null && field.current_moisture !== undefined
        ? `${field.current_moisture}%`
        : 'N/A';
        
      card.innerHTML = `
        <div class="field-card-header">
          <div>
            <h3 class="field-card-title">${field.field_name}</h3>
            <span class="field-card-crop">${field.crop} • ${field.area} Acres</span>
          </div>
        </div>
        <div class="field-card-moisture">
          <svg class="moisture-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
          </svg>
          <span>Moisture: ${moistureDisplay}</span>
        </div>
        <div class="field-card-footer">
          <span class="status-badge ${badgeClass}">
            ${badgeIconHtml}
            ${field.status}
          </span>
        </div>
      `;
      
      card.addEventListener('click', () => {
        openFieldDrawer(field.id);
      });
      
      mapGrid.appendChild(card);
    });
  }
  
  // Drawer open/close logic
  function openFieldDrawer(fieldId) {
    drawer.classList.add('active');
    drawerLoading.style.display = 'flex';
    drawerDetailsContent.style.display = 'none';
    
    authFetch(`${API_BASE_URL}/api/fields/${fieldId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load field details');
        return res.json();
      })
      .then(field => {
        drawerLoading.style.display = 'none';
        drawerDetailsContent.style.display = 'block';
        
        // Populate drawer
        drawerFieldName.textContent = field.field_name;
        drawerCrop.textContent = field.crop;
        drawerArea.textContent = `${field.area} Acres`;
        drawerLocation.textContent = field.location || `${field.latitude.toFixed(4)}, ${field.longitude.toFixed(4)}`;
        
        const moisturePct = field.current_moisture !== null && field.current_moisture !== undefined
          ? `${field.current_moisture}%`
          : 'N/A';
        drawerMoisture.textContent = moisturePct;
        drawerMoisturePct.textContent = moisturePct;
        
        if (field.current_moisture !== null && field.current_moisture !== undefined) {
          drawerMoistureFill.style.width = `${field.current_moisture}%`;
          if (field.current_moisture < 25) {
            drawerMoistureFill.style.backgroundColor = '#ff9f43'; // warning orange
          } else {
            drawerMoistureFill.style.backgroundColor = 'var(--accent-blue)';
          }
        } else {
          drawerMoistureFill.style.width = '0%';
        }
        
        // Health status badge
        const statusLower = field.status.toLowerCase();
        let badgeClass = 'badge-healthy';
        if (statusLower === 'healthy') {
          badgeClass = 'badge-healthy';
        } else if (statusLower.includes('moisture') || statusLower.includes('attention') || statusLower.includes('low')) {
          badgeClass = 'badge-attention';
        } else {
          badgeClass = 'badge-critical';
        }
        drawerStatusBadge.className = `status-badge ${badgeClass}`;
        drawerStatusBadge.textContent = field.status;
        
        // Disease status
        drawerDiseaseStatus.textContent = field.disease_status || 'Healthy / No Disease';
        drawerDiseaseStatus.className = 'drawer-val-large';
        if (statusLower === 'diseased' || statusLower === 'infected') {
          drawerDiseaseStatus.classList.add('text-danger');
        } else if (statusLower.includes('moisture')) {
          drawerDiseaseStatus.classList.add('text-warning');
        } else {
          drawerDiseaseStatus.style.color = 'var(--primary-color)';
        }
        
        // Scan Time
        drawerScanTime.textContent = field.last_scan_time || 'N/A';
        
        // Recommendation Box
        drawerAiRecommendation.textContent = field.ai_recommendation || 'No suggestions available.';
        drawerAiRecBox.className = 'drawer-section ai-rec-section';
        if (statusLower === 'diseased' || statusLower === 'infected') {
          drawerAiRecBox.classList.add('rec-severe');
        } else if (statusLower.includes('moisture')) {
          drawerAiRecBox.classList.add('rec-warning');
        }
      })
      .catch(err => {
        console.error(err);
        showToast('Error loading details: ' + err.message);
        closeFieldDrawer();
      });
  }
  
  function closeFieldDrawer() {
    drawer.classList.remove('active');
  }
  
  if (btnDrawerClose) btnDrawerClose.addEventListener('click', closeFieldDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeFieldDrawer);
  
  // Expose loadMapData globally so other events can call it to refresh
  window.refreshFieldMap = loadMapData;
  
  // Initial load
  loadMapData();
  
  // Periodic polling refresh: every 10 seconds if tab-map is active
  if (window.mapPollInterval) clearInterval(window.mapPollInterval);
  window.mapPollInterval = setInterval(() => {
    const tabMap = document.getElementById('tab-map');
    if (tabMap && tabMap.classList.contains('active')) {
      loadMapData();
    }
  }, 10000);
}


/**
 * Setup Reports and Analytics: Interactive filters, metric recalculations, dynamic chart updates, and overlay simulations.
 */
function setupReports() {
  const cropFilter = document.getElementById('reports-crop-filter');
  const btnGenerateReport = document.getElementById('btn-generate-report');
  
  if (!cropFilter) return;

  const reportsData = {
    all: {
      scans: 156,
      diseases: 38,
      moisture: '26%',
      alerts: 11,
      earlyBlight: 30,
      leafRust: 22,
      powderyMildew: 14,
      bacterialSpot: 10,
      healthy: 13,
      pieLow: 35,
      pieMod: 45,
      pieHigh: 20
    },
    wheat: {
      scans: 62,
      diseases: 12,
      moisture: '24%',
      alerts: 3,
      earlyBlight: 0,
      leafRust: 8,
      powderyMildew: 4,
      bacterialSpot: 0,
      healthy: 50,
      pieLow: 30,
      pieMod: 60,
      pieHigh: 10
    },
    cotton: {
      scans: 48,
      diseases: 14,
      moisture: '22%',
      alerts: 4,
      earlyBlight: 0,
      leafRust: 14,
      powderyMildew: 0,
      bacterialSpot: 0,
      healthy: 34,
      pieLow: 50,
      pieMod: 40,
      pieHigh: 10
    },
    tomato: {
      scans: 26,
      diseases: 10,
      moisture: '32%',
      alerts: 3,
      earlyBlight: 10,
      leafRust: 0,
      powderyMildew: 0,
      bacterialSpot: 0,
      healthy: 16,
      pieLow: 10,
      pieMod: 20,
      pieHigh: 70
    },
    maize: {
      scans: 20,
      diseases: 2,
      moisture: '28%',
      alerts: 1,
      earlyBlight: 0,
      leafRust: 0,
      powderyMildew: 0,
      bacterialSpot: 2,
      healthy: 18,
      pieLow: 20,
      pieMod: 70,
      pieHigh: 10
    }
  };

  cropFilter.addEventListener('change', (e) => {
    const val = e.target.value;
    const data = reportsData[val];
    if (!data) return;

    // Recalculate summary stats card numbers with smooth animation (or instant update)
    document.getElementById('rep-total-scans').textContent = data.scans;
    document.getElementById('rep-diseases').textContent = data.diseases;
    document.getElementById('rep-avg-moisture').textContent = data.moisture;
    document.getElementById('rep-alerts').textContent = data.alerts;

    // Update Bar heights and tooltips
    updateBar('bar-early-blight', data.earlyBlight);
    updateBar('bar-leaf-rust', data.leafRust);
    updateBar('bar-powdery-mildew', data.powderyMildew);
    updateBar('bar-bacterial', data.bacterialSpot);
    updateBar('bar-healthy', data.healthy);

    // Update Conic Gradient Pie Chart circle background & percentages text
    const pieCircle = document.getElementById('pie-chart-circle');
    if (pieCircle) {
      const limit1 = data.pieLow;
      const limit2 = data.pieLow + data.pieMod;
      pieCircle.style.background = `conic-gradient(#e67e22 0% ${limit1}%, #f1c40f ${limit1}% ${limit2}%, #2ecc71 ${limit2}% 100%)`;
    }
    
    document.getElementById('pie-pct-low').textContent = `${data.pieLow}%`;
    document.getElementById('pie-pct-mod').textContent = `${data.pieMod}%`;
    document.getElementById('pie-pct-high').textContent = `${data.pieHigh}%`;

    // Filter Recent Activity Table Rows
    const tableRows = document.querySelectorAll('#reports-table-body tr');
    tableRows.forEach(row => {
      const rowCrop = row.getAttribute('data-crop-type');
      if (val === 'all' || rowCrop === val) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });

    showToast(`Filtered report data for ${e.target.options[e.target.selectedIndex].text}`);
  });

  function updateBar(barId, val) {
    const bar = document.getElementById(barId);
    if (!bar) return;
    
    // Scale max is 40. Calculate percent height: (val / 40) * 100
    const heightPct = Math.min(100, (val / 40) * 100);
    bar.style.height = `${heightPct}%`;
    
    // Update data-value and tooltip
    bar.setAttribute('data-value', val);
    const tooltip = bar.querySelector('.bar-value-tooltip');
    if (tooltip) {
      tooltip.textContent = val;
    }
  }

  // Generate Report simulated action
  if (btnGenerateReport) {
    btnGenerateReport.addEventListener('click', () => {
      btnGenerateReport.disabled = true;
      btnGenerateReport.textContent = 'Generating...';
      
      showToast('Generating analytics data...');
      
      setTimeout(() => {
        showToast('Compiling scan logs...');
        
        setTimeout(() => {
          showToast('Success: AgriCrop_Report_June_2024.pdf downloaded!');
          btnGenerateReport.disabled = false;
          btnGenerateReport.textContent = 'Generate Report';
        }, 1200);
      }, 1000);
    });
  }
  
  // Set initial state
  const initialData = reportsData['all'];
  const pieCircle = document.getElementById('pie-chart-circle');
  if (pieCircle && initialData) {
    const limit1 = initialData.pieLow;
    const limit2 = initialData.pieLow + initialData.pieMod;
    pieCircle.style.background = `conic-gradient(#e67e22 0% ${limit1}%, #f1c40f ${limit1}% ${limit2}%, #2ecc71 ${limit2}% 100%)`;
  }
}

/**
 * Setup Alerts: Risk filter pills, search input querying, and redirect view detail buttons.
 */
function setupAlerts() {
  const filterPills = document.querySelectorAll('.filter-pill');
  const searchInput = document.getElementById('alerts-search');
  const alertsListWrapper = document.getElementById('alerts-list-wrapper');

  if (!alertsListWrapper) return;

  let allAlerts = [];

  // Relative time helper
  function formatRelativeTime(dateStr) {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHrs = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHrs / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHrs < 24) return `${diffHrs}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays}d ago`;
    } catch (e) {
      return '';
    }
  }

  function fetchAndRenderAlerts() {
    authFetch(`${API_BASE_URL}/api/alerts`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch alerts');
        return res.json();
      })
      .then(alerts => {
        allAlerts = alerts;
        renderAlertFeed();
      })
      .catch(err => {
        console.error('Error fetching alerts feed:', err);
        alertsListWrapper.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 40px 0;">Error loading alerts feed.</p>`;
      });
  }

  function renderAlertFeed() {
    const activePill = document.querySelector('.filter-pill.active');
    const category = activePill ? activePill.getAttribute('data-filter') : 'all'; // all, high, medium, low
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    alertsListWrapper.innerHTML = '';

    // Filter alerts
    const filtered = allAlerts.filter(alert => {
      const matchesPriority = (category === 'all' || alert.priority.toLowerCase() === category);
      const searchContent = `${alert.title} ${alert.message} ${alert.type}`.toLowerCase();
      const matchesSearch = searchContent.includes(query);
      return matchesPriority && matchesSearch;
    });

    if (filtered.length === 0) {
      alertsListWrapper.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; color: var(--text-muted); font-weight: 500;">
          <p>No alerts match the selected criteria.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(alert => {
      const card = document.createElement('div');
      card.className = `alert-card ${alert.status === 'Unread' ? 'unread' : ''}`;
      
      // Determine border color class
      let borderClass = 'border-green';
      let tagClass = 'tag-green';
      let iconClass = 'bg-green-tint';
      let iconSvg = '';

      if (alert.priority === 'High') {
        borderClass = 'border-red';
        tagClass = 'tag-red';
        iconClass = 'bg-red-tint';
      } else if (alert.priority === 'Medium') {
        borderClass = 'border-orange';
        tagClass = 'tag-orange';
        iconClass = 'bg-orange-tint';
      }

      card.classList.add(borderClass);

      // Icon SVG based on Alert Type
      if (alert.type === 'Disease') {
        iconSvg = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          </svg>
        `;
      } else if (alert.type === 'Moisture') {
        iconSvg = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
          </svg>
        `;
      } else if (alert.type === 'Weather') {
        iconSvg = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
          </svg>
        `;
      } else {
        iconSvg = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        `;
      }

      card.innerHTML = `
        <div class="alert-left-content">
          <div class="alert-icon-wrapper ${iconClass}">
            ${iconSvg}
          </div>
          <div class="alert-text-details">
            <div class="alert-title-row">
              <h3>${alert.title}</h3>
              <span class="alert-tag ${tagClass}">${alert.priority} Priority</span>
              ${alert.status === 'Unread' ? '<span class="alert-tag" style="background-color: rgba(14,111,66,0.1); color: var(--primary-color);">Unread</span>' : ''}
            </div>
            <p style="margin: 4px 0 8px 0; font-size: 13.5px; color: var(--text-main); line-height: 1.4;">${alert.message}</p>
            <div class="alert-meta-grid">
              <span>Type: <strong>${alert.type}</strong></span>
              ${alert.field_id ? `<span>Field ID: <strong>${alert.field_id.substring(0,8)}...</strong></span>` : ''}
            </div>
          </div>
        </div>
        <div class="alert-right-content">
          <span class="alert-time-rel">${formatRelativeTime(alert.created_at)}</span>
          <button class="btn-alert-details" style="margin-top: 10px;">
            ${alert.field_id ? 'Locate Field' : 'View Details'}
          </button>
        </div>
      `;

      // Click card details button
      const detailsBtn = card.querySelector('.btn-alert-details');
      detailsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleAlertClick(alert);
      });

      alertsListWrapper.appendChild(card);
    });
  }

  // Filter Pills Click
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      renderAlertFeed();
    });
  });

  // Search input typing
  if (searchInput) {
    searchInput.addEventListener('input', renderAlertFeed);
  }

  // Expose global fetch helper
  window.refreshAlertsFeed = fetchAndRenderAlerts;

  // Initial load of feed
  fetchAndRenderAlerts();
}

// ==========================================
// DYNAMIC DASHBOARD INTEGRATION
// ==========================================

let isInitialLoad = true;

function setupDashboard() {
  initDashboardStates();
  
  const token = localStorage.getItem('token');
  const overlay = document.getElementById('auth-overlay');
  
  if (token) {
    if (overlay) overlay.style.display = 'none';
    fetchDashboardData();
  } else {
    if (overlay) overlay.style.display = 'flex';
  }
  
  // Auto refresh every 30 seconds if authenticated
  setInterval(() => {
    if (localStorage.getItem('token')) {
      fetchDashboardData();
    }
  }, 30000);
  
  // Setup Auth Event Listeners
  setupAuthListeners();
}

function initDashboardStates() {
  const tab = document.getElementById('tab-dashboard');
  if (!tab) return;
  
  // Wrap existing content in #dashboard-content if not already done
  let content = document.getElementById('dashboard-content');
  if (!content) {
    content = document.createElement('div');
    content.id = 'dashboard-content';
    while (tab.firstChild) {
      content.appendChild(tab.firstChild);
    }
    tab.appendChild(content);
  }
  
  // Inject loading state if not exists
  let loading = document.getElementById('dashboard-loading');
  if (!loading) {
    loading = document.createElement('div');
    loading.id = 'dashboard-loading';
    Object.assign(loading.style, {
      display: 'none',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      gap: '16px'
    });
    loading.innerHTML = `
      <div class="spinner"></div>
      <p style="color: var(--text-muted); font-size: 14px; font-weight: 500;">Loading farm telemetry...</p>
    `;
    tab.appendChild(loading);
  }
  
  // Inject error state if not exists
  let error = document.getElementById('dashboard-error');
  if (!error) {
    error = document.createElement('div');
    error.id = 'dashboard-error';
    Object.assign(error.style, {
      display: 'none',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      gap: '16px',
      textAlign: 'center',
      padding: '24px'
    });
    error.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent-red)" stroke-width="2" style="width: 48px; height: 48px;">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <h3 style="color: var(--accent-red); margin: 0; font-size: 18px;">Dashboard Unavailable</h3>
      <p id="dashboard-error-msg" style="color: var(--text-muted); font-size: 14px; margin: 0; max-width: 320px;">Could not connect to the AgriCrop backend service.</p>
      <button id="btn-dashboard-retry" style="margin-top: 8px; background-color: var(--primary-color); border: none; padding: 10px 20px; border-radius: 6px; color: white; cursor: pointer; font-size: 14px; font-weight: 600; transition: background-color 0.2s;">Retry Connection</button>
    `;
    tab.appendChild(error);
    
    document.getElementById('btn-dashboard-retry').addEventListener('click', () => {
      fetchDashboardData();
    });
  }
}

function fetchDashboardData() {
  const content = document.getElementById('dashboard-content');
  const loading = document.getElementById('dashboard-loading');
  const error = document.getElementById('dashboard-error');
  
  if (!content || !loading || !error) return;
  
  if (isInitialLoad) {
    content.style.display = 'none';
    loading.style.display = 'flex';
    error.style.display = 'none';
  }
  
  Promise.all([
    authFetch(`${API_BASE_URL}/api/dashboard/overview`).then(r => {
      if (!r.ok) throw new Error('Failed to load dashboard overview');
      return r.json();
    }),
    authFetch(`${API_BASE_URL}/api/fields`).then(r => {
      if (!r.ok) throw new Error('Failed to load fields data');
      return r.json();
    })
  ])
  .then(([overview, fields]) => {
    loading.style.display = 'none';
    error.style.display = 'none';
    content.style.display = 'block';
    
    updateStatsGrid(overview.stats, overview.moisture_summary);
    renderFields(fields);
    renderTasks(fields);
    renderSuggestions(overview, fields);
    renderRecentScans(overview.recent_scans);
    syncInteractiveMap(fields);
    if (window.refreshFieldMap) window.refreshFieldMap();
    if (window.refreshNotifications) window.refreshNotifications();
    if (window.refreshAlertsFeed) window.refreshAlertsFeed();
    
    isInitialLoad = false;
  })
  .catch(err => {
    console.error(err);
    if (isInitialLoad) {
      document.getElementById('dashboard-error-msg').textContent = err.message || 'Could not connect to the AgriCrop backend service.';
      loading.style.display = 'none';
      error.style.display = 'flex';
    } else {
      showToast('Refresh failed: ' + err.message);
    }
  });
}

function updateStatsGrid(stats, moistureSummary) {
  const healthyEl = document.getElementById('stat-healthy-count');
  const attentionEl = document.getElementById('stat-attention-count');
  const criticalEl = document.getElementById('stat-critical-count');
  const totalEl = document.getElementById('stat-total-count');
  
  if (healthyEl) healthyEl.textContent = stats.healthy_fields;
  if (attentionEl) attentionEl.textContent = moistureSummary.recommendations.Required || 0;
  if (criticalEl) criticalEl.textContent = stats.diseased_fields;
  if (totalEl) totalEl.textContent = stats.total_fields;
}

function renderFields(fields) {
  const container = document.querySelector('.fields-list');
  const profileTableBody = document.querySelector('.fields-table tbody');

  // Render Dashboard Fields List
  if (container) {
    container.innerHTML = '';
    if (fields.length === 0) {
      container.innerHTML = `
        <li style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; color: var(--text-muted); text-align: center;">
          <span style="font-size: 13px; font-weight: 500;">No registered fields found.</span>
        </li>
      `;
    } else {
      fields.forEach(field => {
        const li = document.createElement('li');
        li.className = 'field-item';
        const fieldNum = field.field_name.replace(/\D/g, '') || field.id;
        li.setAttribute('data-field-id', fieldNum);
        
        let imgSrc = '/assets/crop_wheat.png';
        const cropLower = field.crop.toLowerCase();
        if (cropLower.includes('wheat')) imgSrc = '/assets/crop_wheat.png';
        else if (cropLower.includes('cotton')) imgSrc = '/assets/crop_cotton.png';
        else if (cropLower.includes('tomato')) imgSrc = '/assets/crop_tomato.png';
        else if (cropLower.includes('maize') || cropLower.includes('corn')) imgSrc = '/assets/crop_maize.png';
        
        let badgeClass = 'badge-healthy';
        let badgeText = field.status;
        let badgeIconHtml = '';
        
        const statusLower = field.status.toLowerCase();
        if (statusLower === 'healthy') {
          badgeClass = 'badge-healthy';
        } else if (statusLower.includes('moisture') || statusLower.includes('attention') || statusLower.includes('low')) {
          badgeClass = 'badge-attention';
          badgeIconHtml = `
            <svg class="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
            </svg>
          `;
        } else {
          badgeClass = 'badge-critical';
          badgeIconHtml = `
            <svg class="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            </svg>
          `;
        }
        
        li.innerHTML = `
          <div class="field-img">
            <img src="${imgSrc}" alt="${field.crop} crop">
          </div>
          <div class="field-details">
            <h3>${field.field_name}</h3>
            <p>${field.crop} • ${field.area} Acres</p>
          </div>
          <span class="status-badge ${badgeClass}">
            ${badgeIconHtml}
            ${badgeText}
          </span>
        `;
        container.appendChild(li);
      });
      bindFieldHoverEvents();
    }
  }

  // Render Profile Fields Table
  if (profileTableBody) {
    profileTableBody.innerHTML = '';
    if (fields.length === 0) {
      profileTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">No registered fields found.</td>
        </tr>
      `;
    } else {
      fields.forEach(field => {
        const tr = document.createElement('tr');
        
        let riskClass = 'risk-healthy';
        const statusLower = field.status.toLowerCase();
        if (statusLower === 'healthy') {
          riskClass = 'risk-healthy';
        } else if (statusLower.includes('moisture') || statusLower.includes('attention') || statusLower.includes('low')) {
          riskClass = 'risk-medium';
        } else {
          riskClass = 'risk-high';
        }
        
        tr.innerHTML = `
          <td>${field.field_name}</td>
          <td>${field.crop}</td>
          <td>${field.area}</td>
          <td>${field.location || (field.latitude.toFixed(4) + ', ' + field.longitude.toFixed(4))}</td>
          <td><span class="risk-lbl ${riskClass}">${field.status}</span></td>
        `;
        profileTableBody.appendChild(tr);
      });
    }
  }
}

function bindFieldHoverEvents() {
  const fieldItems = document.querySelectorAll('.field-item');
  fieldItems.forEach(item => {
    const fieldId = item.getAttribute('data-field-id');
    const matchingPolygon = document.querySelector(`.map-field-polygon[data-field="${fieldId}"]`);
    
    if (!matchingPolygon) return;

    item.addEventListener('mouseenter', () => {
      item.classList.add('active-field');
      matchingPolygon.classList.add('active-polygon');
      matchingPolygon.style.fillOpacity = '0.35';
    });

    item.addEventListener('mouseleave', () => {
      item.classList.remove('active-field');
      matchingPolygon.classList.remove('active-polygon');
      matchingPolygon.style.fillOpacity = '';
    });
    
    item.addEventListener('click', () => {
      showToast(`Viewing details for Field ${fieldId}`);
    });
  });
}

function renderTasks(fields) {
  const container = document.querySelector('.tasks-list');
  if (!container) return;
  container.innerHTML = '';
  
  let taskCount = 1;
  fields.forEach(field => {
    const statusLower = field.status.toLowerCase();
    
    if (statusLower.includes('moisture') || statusLower.includes('attention') || statusLower.includes('low')) {
      const li = document.createElement('li');
      li.className = 'task-item';
      li.id = `task-${taskCount}`;
      li.innerHTML = `
        <div class="task-icon-wrapper task-icon-blue">
          <svg class="task-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
          </svg>
        </div>
        <div class="task-content">
          <label class="task-checkbox-container">
            <span class="task-title">Irrigate ${field.field_name}</span>
            <span class="task-subtitle">Low soil moisture detected</span>
            <input type="checkbox" id="chk-task-${taskCount}">
            <span class="checkmark"></span>
          </label>
        </div>
      `;
      container.appendChild(li);
      taskCount++;
    } else if (statusLower === 'infected' || statusLower === 'diseased' || (!statusLower.includes('healthy') && statusLower !== 'fallow')) {
      const li1 = document.createElement('li');
      li1.className = 'task-item';
      li1.id = `task-${taskCount}`;
      li1.innerHTML = `
        <div class="task-icon-wrapper task-icon-green">
          <svg class="task-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2 22c1.25-3.67 4.25-6.67 8-8V2c-5.5 0-8 4.5-8 8v12z"></path>
          </svg>
        </div>
        <div class="task-content">
          <label class="task-checkbox-container">
            <span class="task-title">Check ${field.field_name}</span>
            <span class="task-subtitle">${field.status} detected</span>
            <input type="checkbox" id="chk-task-${taskCount}">
            <span class="checkmark"></span>
          </label>
        </div>
      `;
      container.appendChild(li1);
      taskCount++;
      
      const li2 = document.createElement('li');
      li2.className = 'task-item';
      li2.id = `task-${taskCount}`;
      li2.innerHTML = `
        <div class="task-icon-wrapper task-icon-orange">
          <svg class="task-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
        <div class="task-content">
          <label class="task-checkbox-container">
            <span class="task-title">Apply Treatment</span>
            <span class="task-subtitle">Recommended for ${field.field_name}</span>
            <input type="checkbox" id="chk-task-${taskCount}">
            <span class="checkmark"></span>
          </label>
        </div>
      `;
      container.appendChild(li2);
      taskCount++;
    }
  });
  
  if (taskCount === 1) {
    container.innerHTML = `
      <li style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; color: var(--text-muted); text-align: center; gap: 8px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" stroke-width="2" style="width: 32px; height: 32px;">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span style="font-size: 13px; font-weight: 500;">All fields are healthy. No immediate tasks!</span>
      </li>
    `;
  } else {
    bindTaskCheckboxEvents();
  }
}

function bindTaskCheckboxEvents() {
  const taskItems = document.querySelectorAll('.task-item');
  taskItems.forEach(item => {
    const chk = item.querySelector('input[type="checkbox"]');
    if (chk) {
      chk.addEventListener('change', () => {
        if (chk.checked) {
          item.classList.add('completed');
          showToast(`Completed: ${item.querySelector('.task-title').innerText}`);
        } else {
          item.classList.remove('completed');
        }
      });
    }
  });
}

function renderSuggestions(overview, fields) {
  const container = document.querySelector('.suggestions-list');
  if (!container) return;
  container.innerHTML = '';
  
  const moistureFields = fields.filter(f => {
    const s = f.status.toLowerCase();
    return s.includes('moisture') || s.includes('attention') || s.includes('low');
  });
  const diseasedFields = fields.filter(f => {
    const s = f.status.toLowerCase();
    return s === 'infected' || s === 'diseased' || (!s.includes('healthy') && s !== 'fallow');
  });
  
  if (moistureFields.length > 0) {
    const f = moistureFields[0];
    const li = document.createElement('li');
    li.className = 'suggestion-item sugg-blue';
    li.innerHTML = `
      <div class="suggestion-icon-wrapper">
        <svg class="suggestion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
        </svg>
      </div>
      <div class="suggestion-content">
        <h4>Irrigate ${f.field_name} within 24 hours</h4>
        <p>Soil moisture is low.</p>
      </div>
    `;
    container.appendChild(li);
  }
  
  if (diseasedFields.length > 0) {
    const f = diseasedFields[0];
    const li = document.createElement('li');
    li.className = 'suggestion-item sugg-green';
    li.innerHTML = `
      <div class="suggestion-icon-wrapper">
        <svg class="suggestion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M2 22c1.25-3.67 4.25-6.67 8-8V2c-5.5 0-8 4.5-8 8v12z"></path>
        </svg>
      </div>
      <div class="suggestion-content">
        <h4>Monitor ${f.field_name} closely</h4>
        <p>${f.status} may spread.</p>
      </div>
    `;
    container.appendChild(li);
  }
  
  const liDefault = document.createElement('li');
  liDefault.className = 'suggestion-item sugg-orange';
  const avgMoisture = overview.stats.average_moisture;
  liDefault.innerHTML = `
    <div class="suggestion-icon-wrapper">
      <svg class="suggestion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
      </svg>
    </div>
    <div class="suggestion-content">
      <h4>Average soil moisture is ${avgMoisture}%</h4>
      <p>${avgMoisture < 25 ? 'Critical level. Please check irrigation.' : 'Stable moisture level across farm.'}</p>
    </div>
  `;
  container.appendChild(liDefault);
}

function renderRecentScans(scans) {
  const container = document.querySelector('.recent-grid');
  if (!container) return;
  container.innerHTML = '';
  
  if (scans.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; color: var(--text-muted);">
        <p style="font-size: 13px; font-weight: 500; margin: 0;">No recent scans found.</p>
      </div>
    `;
    return;
  }
  
  const keyMap = {
    'Early Blight': 'early-blight',
    'Leaf Rust': 'leaf-rust',
    'Healthy': 'healthy',
    'Powdery Mildew': 'powdery-mildew'
  };
  
  scans.forEach((scan, index) => {
    const key = keyMap[scan.disease] || 'early-blight';
    let pctClass = 'text-warning';
    let imgPath = '/assets/leaf_early_blight.png';
    
    if (scan.disease === 'Healthy') {
      pctClass = 'text-success';
      imgPath = '/assets/leaf_healthy.png';
    } else if (scan.disease === 'Early Blight' || scan.disease === 'Bacterial Spot') {
      pctClass = 'text-danger';
      imgPath = '/assets/leaf_early_blight.png';
    } else if (scan.disease === 'Leaf Rust') {
      pctClass = 'text-warning';
      imgPath = '/assets/leaf_rust.png';
    } else if (scan.disease === 'Powdery Mildew') {
      pctClass = 'text-warning';
      imgPath = '/assets/leaf_powdery_mildew.png';
    }
    
    const date = new Date(scan.timestamp);
    const dateStr = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    
    if (!window.diseaseData) {
      window.diseaseData = {};
    }
    window.diseaseData[scan.id] = {
      title: scan.disease,
      confidence: `${scan.confidence}%`,
      recommendation: scan.recommendation,
      image: imgPath,
      class: scan.disease === 'Healthy' ? 'val-success' : (scan.disease === 'Early Blight' ? 'val-danger' : 'val-warning')
    };
    
    const card = document.createElement('div');
    card.className = `recent-card${index === 0 ? ' active-card' : ''}`;
    card.setAttribute('data-scan-id', scan.id);
    
    card.innerHTML = `
      <div class="recent-img-wrapper">
        <img src="${imgPath}" alt="${scan.disease} scan">
      </div>
      <div class="recent-info">
        <h4>${scan.disease}</h4>
        <div class="recent-meta">
          <span class="recent-pct ${pctClass}">${scan.confidence}%</span>
          <span class="recent-date">${dateStr}</span>
        </div>
      </div>
    `;
    
    card.addEventListener('click', () => {
      const cards = document.querySelectorAll('.recent-card');
      cards.forEach(c => c.classList.remove('active-card'));
      card.classList.add('active-card');
      
      const detailImg = document.getElementById('result-img');
      const detailDisease = document.getElementById('result-disease');
      const detailConfidence = document.getElementById('result-confidence');
      const detailRec = document.getElementById('result-recommendation');
      
      const details = window.diseaseData[scan.id];
      if (details && detailImg) {
        detailImg.src = details.image;
        detailDisease.textContent = details.title;
        detailConfidence.textContent = details.confidence;
        detailRec.textContent = details.recommendation;
        
        detailDisease.className = 'result-value val-disease';
        detailDisease.classList.add(details.class);
        
        document.getElementById('result-content').style.display = 'block';
        document.getElementById('result-empty').style.display = 'none';
        
        showToast(`Viewing result for ${details.title}`);
      }
    });
    
    container.appendChild(card);
  });
  
  const firstScan = scans[0];
  const resultContent = document.getElementById('result-content');
  if (firstScan && resultContent && resultContent.style.display !== 'block') {
    const details = window.diseaseData[firstScan.id];
    const detailImg = document.getElementById('result-img');
    const detailDisease = document.getElementById('result-disease');
    const detailConfidence = document.getElementById('result-confidence');
    const detailRec = document.getElementById('result-recommendation');
    
    if (details && detailImg) {
      detailImg.src = details.image;
      detailDisease.textContent = details.title;
      detailConfidence.textContent = details.confidence;
      detailRec.textContent = details.recommendation;
      
      detailDisease.className = 'result-value val-disease';
      detailDisease.classList.add(details.class);
      
      resultContent.style.display = 'block';
      document.getElementById('result-empty').style.display = 'none';
    }
  }
}

function syncInteractiveMap(fields) {
  window.mapFieldData = {};
  
  fields.forEach(field => {
    const fieldNum = field.field_name.replace(/\D/g, '');
    if (!fieldNum) return;
    
    const statusLower = field.status.toLowerCase();
    let color = '#2ecc71';
    let statusText = 'Healthy';
    let statusClass = 'healthy';
    
    if (statusLower === 'healthy') {
      color = '#2ecc71';
      statusText = 'Healthy';
      statusClass = 'healthy';
    } else if (statusLower.includes('moisture') || statusLower.includes('attention') || statusLower.includes('low')) {
      color = '#f1c40f';
      statusText = 'Low Moisture';
      statusClass = 'attention';
    } else if (statusLower === 'disease suspected' || statusLower === 'suspected') {
      color = '#e67e22';
      statusText = 'Disease Suspected';
      statusClass = 'high';
    } else if (statusLower === 'high risk' || statusLower === 'diseased' || statusLower === 'infected' || (!statusLower.includes('healthy') && statusLower !== 'fallow')) {
      color = '#e74c3c';
      statusText = 'High Risk';
      statusClass = 'critical';
    }
    
    window.mapFieldData[fieldNum] = {
      title: field.field_name,
      crop: `${field.crop} • ${field.area} Acres`,
      status: statusText,
      color: color
    };
    
    const poly = document.querySelector(`.map-field-polygon[data-field="${fieldNum}"]`);
    if (poly) {
      poly.className.baseVal = `map-field-polygon field-polygon-${statusClass}`;
    }
    
    const pin = document.querySelector(`.map-pin[data-field="${fieldNum}"]`);
    if (pin) {
      pin.className = `map-pin pin-${statusClass}`;
    }
    
    const fullPin = document.querySelector(`.field-map-pin[data-field-id="${fieldNum}"]`);
    if (fullPin) {
      let pinThemeClass = 'map-pin-healthy';
      if (statusClass === 'attention') {
        pinThemeClass = 'map-pin-low';
      } else if (statusClass === 'high') {
        pinThemeClass = 'map-pin-high';
      } else if (statusClass === 'critical') {
        pinThemeClass = 'map-pin-critical';
      }
      fullPin.className = `field-map-pin ${pinThemeClass}`;
      
      if (!window.fullMapFieldDetails) {
        window.fullMapFieldDetails = {};
      }
      window.fullMapFieldDetails[fieldNum] = {
        id: fieldNum,
        crop: field.crop,
        disease: statusClass === 'critical' || statusClass === 'high' ? (field.disease_status || field.status) : (statusClass === 'attention' ? 'Low Moisture' : 'None'),
        severity: statusClass === 'critical' ? 'High' : (statusClass === 'high' ? 'Medium' : (statusClass === 'attention' ? 'Low' : 'None')),
        detected: statusClass === 'healthy' ? 'N/A' : new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        isCritical: statusClass === 'critical',
        isWarning: statusClass === 'attention' || statusClass === 'high'
      };
    }
  });
}

function setupAuthListeners() {
  const overlay = document.getElementById('auth-overlay');
  const loginSection = document.getElementById('login-section');
  const registerSection = document.getElementById('register-section');
  
  const linkShowRegister = document.getElementById('link-show-register');
  const linkShowLogin = document.getElementById('link-show-login');
  
  if (linkShowRegister) {
    linkShowRegister.addEventListener('click', () => {
      loginSection.style.display = 'none';
      registerSection.style.display = 'block';
    });
  }
  
  if (linkShowLogin) {
    linkShowLogin.addEventListener('click', () => {
      registerSection.style.display = 'none';
      loginSection.style.display = 'block';
    });
  }
  
  const btnLoginSubmit = document.getElementById('btn-login-submit');
  const btnRegisterSubmit = document.getElementById('btn-register-submit');
  
  if (btnLoginSubmit) {
    btnLoginSubmit.addEventListener('click', () => {
      const usernameInput = document.getElementById('login-username');
      const passwordInput = document.getElementById('login-password');
      
      const username = usernameInput.value.trim();
      const password = passwordInput.value;
      
      if (!username || !password) {
        showToast('Please fill in username and password.');
        return;
      }
      
      btnLoginSubmit.disabled = true;
      btnLoginSubmit.textContent = 'Signing in...';
      
      fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      })
      .then(async res => {
        btnLoginSubmit.disabled = false;
        btnLoginSubmit.textContent = 'Sign In';
        if (!res.ok) {
          const errData = await res.json().catch(() => ({ detail: 'Login failed' }));
          throw new Error(errData.detail || 'Incorrect username or password');
        }
        return res.json();
      })
      .then(data => {
        localStorage.setItem('token', data.access_token);
        if (overlay) overlay.style.display = 'none';
        showToast(`Welcome back, ${username}! 🌱`);
        
        // Dynamically update username display
        const profileName = document.querySelector('.welcome-message h1');
        if (profileName) {
          profileName.innerHTML = `Welcome back, ${username}! <span class="emoji">🌱</span>`;
        }
        const inputNameVal = document.getElementById('prof-name');
        if (inputNameVal) {
          inputNameVal.value = username;
        }
        
        // Reset dynamic states
        isInitialLoad = true;
        fetchDashboardData();
      })
      .catch(err => {
        console.error(err);
        showToast('Error: ' + err.message);
      });
    });
  }
  
  if (btnRegisterSubmit) {
    btnRegisterSubmit.addEventListener('click', () => {
      const usernameInput = document.getElementById('register-username');
      const emailInput = document.getElementById('register-email');
      const passwordInput = document.getElementById('register-password');
      
      const username = usernameInput.value.trim();
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      
      if (!username || !email || !password) {
        showToast('Please fill in all registration fields.');
        return;
      }
      
      if (password.length < 6) {
        showToast('Password must be at least 6 characters long.');
        return;
      }
      
      btnRegisterSubmit.disabled = true;
      btnRegisterSubmit.textContent = 'Creating account...';
      
      fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      })
      .then(async res => {
        btnRegisterSubmit.disabled = false;
        btnRegisterSubmit.textContent = 'Register';
        if (!res.ok) {
          const errData = await res.json().catch(() => ({ detail: 'Registration failed' }));
          throw new Error(errData.detail || 'Registration failed');
        }
        return res.json();
      })
      .then(data => {
        showToast('Registration complete! Please sign in.');
        usernameInput.value = '';
        emailInput.value = '';
        passwordInput.value = '';
        
        registerSection.style.display = 'none';
        loginSection.style.display = 'block';
      })
      .catch(err => {
        console.error(err);
        showToast('Error: ' + err.message);
      });
    });
  }
}

function authFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  if (!options.headers) {
    options.headers = {};
  }
  
  if (options.headers instanceof Headers) {
    if (token) {
      options.headers.set('Authorization', `Bearer ${token}`);
    }
  } else {
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return fetch(url, options).then(response => {
    if (response.status === 401) {
      localStorage.removeItem('token');
      const overlay = document.getElementById('auth-overlay');
      if (overlay) {
        overlay.style.display = 'flex';
      }
      showToast('Session expired. Please sign in again.');
      throw new Error('Unauthorized');
    }
    return response;
  });
}

/**
 * Setup and auto-refresh the Weather Forecast widget
 */
function setupWeatherWidget() {
  function toggleWeatherSkeleton(isLoading) {
    const tempVal = document.getElementById('weather-temp-val');
    const tempDesc = document.getElementById('weather-temp-summary');
    const humidityVal = document.getElementById('weather-humidity-val');
    const rainfallVal = document.getElementById('weather-rainfall-val');
    const windVal = document.getElementById('weather-wind-val');
    const iconImg = document.getElementById('weather-icon-img');

    if (isLoading) {
      if (iconImg) iconImg.style.display = 'none';
      if (tempVal) tempVal.innerHTML = '<span class="weather-skeleton sk-temp"></span>';
      if (tempDesc) tempDesc.innerHTML = '<span class="weather-skeleton sk-desc"></span>';
      if (humidityVal) humidityVal.innerHTML = '<span class="weather-skeleton sk-val"></span>';
      if (rainfallVal) rainfallVal.innerHTML = '<span class="weather-skeleton sk-val"></span>';
      if (windVal) windVal.innerHTML = '<span class="weather-skeleton sk-val"></span>';
    }
  }

  function fetchWeatherData() {
    toggleWeatherSkeleton(true);

    authFetch(`${API_BASE_URL}/api/weather/current`)
      .then(res => {
        if (!res.ok) throw new Error('Weather API unavailable');
        return res.json();
      })
      .then(data => {
        // Success: Cache response in localStorage
        localStorage.setItem('cached_weather', JSON.stringify(data));
        renderWeather(data);
      })
      .catch(err => {
        console.warn('Weather fetch failed, falling back to cache:', err);
        const cached = localStorage.getItem('cached_weather');
        if (cached) {
          try {
            const data = JSON.parse(cached);
            renderWeather(data);
            showToast('Live weather unavailable. Showing cached forecast.');
          } catch (e) {
            displayWeatherError();
          }
        } else {
          displayWeatherError();
        }
      });
  }

  function renderWeather(data) {
    const tempVal = document.getElementById('weather-temp-val');
    const tempDesc = document.getElementById('weather-temp-summary');
    const humidityVal = document.getElementById('weather-humidity-val');
    const rainfallVal = document.getElementById('weather-rainfall-val');
    const windVal = document.getElementById('weather-wind-val');
    const iconImg = document.getElementById('weather-icon-img');
    const cityLabel = document.getElementById('weather-city-label');

    if (tempVal) tempVal.textContent = `${data.temperature}°C`;
    if (tempDesc) tempDesc.textContent = data.weather;
    if (humidityVal) humidityVal.textContent = `${data.humidity}%`;
    if (rainfallVal) rainfallVal.textContent = `${data.rainfall} mm`;
    if (windVal) windVal.textContent = `${data.wind_speed} m/s`;

    if (iconImg) {
      if (data.weather_icon) {
        iconImg.src = `https://openweathermap.org/img/wn/${data.weather_icon}@2x.png`;
        iconImg.style.display = 'block';
      } else {
        iconImg.style.display = 'none';
      }
    }

    if (cityLabel) {
      cityLabel.textContent = `(${data.city})`;
    }
  }

  function displayWeatherError() {
    const tempVal = document.getElementById('weather-temp-val');
    const tempDesc = document.getElementById('weather-temp-summary');
    const humidityVal = document.getElementById('weather-humidity-val');
    const rainfallVal = document.getElementById('weather-rainfall-val');
    const windVal = document.getElementById('weather-wind-val');
    const iconImg = document.getElementById('weather-icon-img');

    if (iconImg) iconImg.style.display = 'none';
    if (tempVal) tempVal.textContent = '--';
    if (tempDesc) tempDesc.textContent = 'Weather data unavailable';
    if (humidityVal) humidityVal.textContent = 'N/A';
    if (rainfallVal) rainfallVal.textContent = 'N/A';
    if (windVal) windVal.textContent = 'N/A';
  }

  // Initial fetch and 30-minute auto-refresh interval
  fetchWeatherData();
  
  if (window.weatherRefreshInterval) clearInterval(window.weatherRefreshInterval);
  window.weatherRefreshInterval = setInterval(() => {
    fetchWeatherData();
  }, 30 * 60 * 1000);
}

