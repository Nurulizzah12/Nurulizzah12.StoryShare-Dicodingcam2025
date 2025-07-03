// src/scripts/utils/message-helpers.js

// Fungsi untuk menampilkan pesan toast (message box)
function showMessageBox(message, type = 'info', duration = 3000) {
    const messageBox = document.getElementById('custom-message-box');
    if (messageBox) {
        messageBox.textContent = message;
        messageBox.className = `message-box ${type} show`;

        setTimeout(() => {
            messageBox.classList.remove('show');
            messageBox.textContent = ''; // Kosongkan teks setelah disembunyikan
        }, duration);
    } else {
        console.warn('Custom message box element not found!');
        // Fallback to console if element not found
        console.log(`[Message: ${type}] ${message}`);
    }
}

// Fungsi untuk menampilkan modal message box
function showModalMessageBox(title, message, callback = null, isConfirm = false) {
    const modalMessageBox = document.getElementById('modal-message-box');
    const modalTitle = document.getElementById('modal-message-title');
    const modalText = document.getElementById('modal-message-text');
    const modalCloseButton = document.getElementById('modal-message-close');
    const modalConfirmButton = document.getElementById('modal-message-confirm');

    if (modalMessageBox && modalTitle && modalText && modalCloseButton && modalConfirmButton) {
        modalTitle.textContent = title;
        modalText.textContent = message;
        modalMessageBox.classList.add('show'); // Tampilkan modal

        // Reset event listeners
        modalCloseButton.onclick = null;
        modalConfirmButton.onclick = null;

        if (isConfirm) {
            modalConfirmButton.style.display = 'inline-block'; // Tampilkan tombol konfirmasi
            modalCloseButton.textContent = 'Batal'; // Ubah teks tombol tutup menjadi batal

            modalConfirmButton.onclick = () => {
                modalMessageBox.classList.remove('show');
                if (callback && typeof callback === 'function') {
                    callback(true); // Panggil callback dengan true jika dikonfirmasi
                }
            };
            modalCloseButton.onclick = () => {
                modalMessageBox.classList.remove('show');
                if (callback && typeof callback === 'function') {
                    callback(false); // Panggil callback dengan false jika dibatalkan
                }
            };
        } else {
            modalConfirmButton.style.display = 'none'; // Sembunyikan tombol konfirmasi
            modalCloseButton.textContent = 'OK'; // Pastikan teks tombol tutup adalah OK

            modalCloseButton.onclick = () => {
                modalMessageBox.classList.remove('show');
                if (callback && typeof callback === 'function') {
                    callback(); // Panggil callback tanpa argumen jika bukan konfirmasi
                }
            };
        }
    } else {
        console.warn('One or more modal message box elements not found!');
        // Fallback to alert if elements not found
        alert(`[Modal: ${title}] ${message}`);
        if (callback && typeof callback === 'function') {
            callback();
        }
    }
}

// Export kedua fungsi ini
export { showMessageBox, showModalMessageBox };

// Jika Anda ingin membuat fungsi getGlobalMessageBoxFunctions yang mengembalikan keduanya:
export function getGlobalMessageBoxFunctions() {
    return { showMessageBox, showModalMessageBox };
}