document.addEventListener('DOMContentLoaded', async () => {
  const calendar = document.querySelector('.calendar');
  const currentDateElement = document.getElementById('current-date');
  const prevMonthButton = document.getElementById('prev-month');
  const nextMonthButton = document.getElementById('next-month');
  const generalNotes = document.getElementById('general-notes');
  const saveGeneral = document.getElementById('save-general');
  const meaningsNotes = document.getElementById('meanings-notes');
  const saveMeanings = document.getElementById('save-meanings');
  const modal = document.getElementById('custom-modal');
  const modalInput = document.getElementById('modal-input');
  const modalSave = document.getElementById('modal-save');
  const closeModal = document.querySelector('.close');
  let currentYear = new Date().getFullYear();
  let currentMonth = new Date().getMonth();

  let savedDays = await window.electronAPI.loadDays();
  const savedGeneralNotes = await window.electronAPI.loadGeneralNotes();
  const savedMeanings = await window.electronAPI.loadMeanings();
  generalNotes.value = savedGeneralNotes;
  meaningsNotes.value = savedMeanings;

  function generateCalendar(year, month) {
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    calendar.innerHTML = '';
    currentDateElement.textContent = `${new Date(year, month).toLocaleString('default', { month: 'long' })} ${year}`;
    let dayCount = 1;

    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        const dayDiv = document.createElement('div');
        if ((row === 0 && col < firstDay) || dayCount > lastDate) {
          calendar.appendChild(dayDiv);
          continue;
        }

        const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayCount).padStart(2, '0')}`;
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = dayCount;

        const notesPreview = document.createElement('div');
        notesPreview.className = 'notes-preview';

        const existingNotes = savedDays.filter((d) => d.date === date).map((d) => d.notes);
        if (existingNotes.length > 0) {
          notesPreview.textContent = existingNotes.join('\n');
        }

        dayDiv.appendChild(dayNumber);
        dayDiv.appendChild(notesPreview);

        dayDiv.addEventListener('click', async () => {
          modal.style.display = 'block';
          modalInput.value = existingNotes.join('\n');

          modalSave.onclick = async () => {
            const notesArray = modalInput.value.split('\n').filter((note) => note.trim());

            await window.electronAPI.deleteDayNotes(date);

            notesArray.forEach((note) => {
              window.electronAPI.saveDayNotes(date, note);
            });

            savedDays = await window.electronAPI.loadDays();
            generateCalendar(year, month);
            modal.style.display = 'none';
          };

          closeModal.onclick = () => {
            modal.style.display = 'none';
          };
        });

        calendar.appendChild(dayDiv);
        dayCount++;
      }
    }
  }

  saveGeneral.addEventListener('click', async () => {
    const content = generalNotes.value;
    try {
      await window.electronAPI.saveGeneralNotes(content);
      showNotification('Anotações Gerais salvas com sucesso!');
      generalNotes.blur(); 
      document.body.focus(); 
    } catch (err) {
      showNotification(`Erro ao salvar Anotações Gerais: ${err}`);
    }
  });

  saveMeanings.addEventListener('click', async () => {
    const content = meaningsNotes.value;
    try {
      await window.electronAPI.saveMeanings(content);
      showNotification('Significados salvos com sucesso!');
      meaningsNotes.blur(); 
      document.body.focus(); 
    } catch (err) {
      showNotification(`Erro ao salvar Significados: ${err}`);
    }
  });

  prevMonthButton.addEventListener('click', () => {
    if (currentMonth === 0) {
      currentMonth = 11;
      currentYear--;
    } else {
      currentMonth--;
    }
    generateCalendar(currentYear, currentMonth);
  });

  nextMonthButton.addEventListener('click', () => {
    if (currentMonth === 11) {
      currentMonth = 0;
      currentYear++;
    } else {
      currentMonth++;
    }
    generateCalendar(currentYear, currentMonth);
  });

  generateCalendar(currentYear, currentMonth);

  const themeButtons = document.querySelectorAll('.theme-btn');
  themeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const themeName = button.getAttribute('data-theme');
      applyTheme(themeName);
    });
  });

  function applyTheme(themeName) {
    document.body.className = themeName;
    localStorage.setItem('selectedTheme', themeName);
  }

  const savedTheme = localStorage.getItem('selectedTheme') || 'light-default';
  applyTheme(savedTheme);

  const createBackupButton = document.getElementById('create-backup');
  const loadBackupButton = document.getElementById('load-backup');

  createBackupButton.addEventListener('click', async () => {
    const result = await window.electronAPI.createBackup();
    showNotification(result.message);
  });

  loadBackupButton.addEventListener('click', async () => {
    const result = await window.electronAPI.loadBackup();
    showNotification(result.message);
    if (result.success) {
      savedDays = await window.electronAPI.loadDays();
      generateCalendar(currentYear, currentMonth);
      generalNotes.value = await window.electronAPI.loadGeneralNotes();
      meaningsNotes.value = await window.electronAPI.loadMeanings();
    }
  });

function showNotification(message) {
  const popup = document.createElement('div');
  popup.className = 'popup-notification';
  popup.textContent = message;

  document.body.appendChild(popup);

  setTimeout(() => {
    popup.classList.add('show');
  }, 10); 

  setTimeout(() => {
    popup.classList.remove('show'); 
    setTimeout(() => {
      popup.remove(); 
    }, 300); 
  }, 3000); 
}
});