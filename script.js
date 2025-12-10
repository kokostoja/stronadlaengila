// =================================================================
// 1. Zmienne globalne i konfiguracja chunków
// =================================================================
const allCities = []; // Tablica do przechowywania załadowanych danych
const searchInput = document.getElementById("citySearch");
const resultsList = document.getElementById("cityResults");
let activeItemIndex = -1; // Indeks aktywnego elementu na liście wyników

// Generujemy listę ścieżek do plików od 0 do 133 (134 pliki)
const chunkFiles = [];
for (let i = 0; i <= 133; i++) {
    // Ważne: ścieżka względna musi być poprawna (folder countries_chunks musi być obok index.html)
    chunkFiles.push(`countries_chunks/countries_${i}.json`);
}

// =================================================================
// 2. Ładowanie i parsowanie miast
// =================================================================
async function loadAllCities() {
    console.log("Rozpoczynam ładowanie miast (134 plików)...");

    // Tworzymy tablicę Promise'ów do równoległego ładowania
    const fetchPromises = chunkFiles.map(file => 
        fetch(file)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Błąd: ${response.status} podczas ładowania ${file}`);
                }
                return response.json();
            })
            .catch(err => {
                console.warn(`Błąd ładowania pliku ${file}:`, err.message);
                return []; // Zwraca pustą tablicę, aby nie zatrzymać Promise.all
            })
    );

    // Czekamy na załadowanie wszystkich Promise'ów (chunków)
    const results = await Promise.all(fetchPromises);
    
    // Łączymy wyniki do globalnej tablicy
    results.forEach(data => allCities.push(...data));

    console.log(`Wszystkie miasta załadowane: ${allCities.length}`);
}

// =================================================================
// 3. Renderowanie i obsługa listy wyników
// =================================================================
function renderResults(matches) {
    resultsList.innerHTML = "";
    activeItemIndex = -1; 
    
    if (matches.length === 0) {
        resultsList.classList.add("hidden");
        return;
    }

    resultsList.classList.remove("hidden");

    matches.forEach((city, index) => {
        const li = document.createElement("li");
        
        // Ulepszone wyświetlanie: Miasto, Region (jeśli istnieje), Kraj
        const regionText = city.region ? `, ${city.region}` : '';
        li.textContent = `${city.name}${regionText}, ${city.country}`;
        
        // Obsługa kliknięcia myszką
        li.addEventListener("click", () => {
            selectCity(city.name);
        });
        
        // Dodajemy atrybut, aby można było odwołać się do danych przy nawigacji klawiaturą
        li.dataset.name = city.name; 
        li.dataset.index = index;

        resultsList.appendChild(li);
    });
}

// Ustawia wybrane miasto w polu input i ukrywa listę
function selectCity(cityName) {
    searchInput.value = cityName;
    resultsList.classList.add("hidden");
}

// =================================================================
// 4. Obsługa zdarzeń i logika wyszukiwania
// =================================================================

// Obsługa wpisywania
searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    
    if (query.length < 2) { // Zaczynamy szukać po 2 znakach
        renderResults([]);
        return;
    }

    // Filtrowanie wyników (limit 50 dla wydajności)
    const matches = allCities
        .filter(c => c.name.toLowerCase().includes(query))
        .slice(0, 50);

    renderResults(matches);
});

// Obsługa klawiszy (Góra, Dół, Enter)
searchInput.addEventListener('keydown', (e) => {
    const items = resultsList.querySelectorAll('li');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeItemIndex = (activeItemIndex + 1) % items.length;
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeItemIndex = (activeItemIndex - 1 + items.length) % items.length;
    } else if (e.key === 'Enter' && activeItemIndex > -1) {
        e.preventDefault();
        // Wywołujemy funkcję tak, jakbyśmy kliknęli myszką
        selectCity(items[activeItemIndex].dataset.name); 
        return;
    }

    // Usuwanie i dodawanie klasy 'active' dla stylizacji (CSS)
    items.forEach(item => item.classList.remove('active'));
    if (activeItemIndex > -1) {
        items[activeItemIndex].classList.add('active');
        items[activeItemIndex].scrollIntoView({ block: 'nearest' }); // Przewijanie do aktywnego elementu
    }
});

// Ukrywanie listy po kliknięciu poza nią
document.addEventListener("click", (e) => {
    if (e.target !== searchInput && e.target !== resultsList && !resultsList.contains(e.target)) {
        resultsList.classList.add("hidden");
    }
});

// =================================================================
// 5. Konfiguracja EmailJS i Wysyłka Formularza
// =================================================================

// Kod inicjujący EmailJS jest w HTML (emailjs.init...)

document.getElementById("contactForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const templateParams = {
        name: document.getElementById("name").value,
        surname: document.getElementById("surname").value,
        email: document.getElementById("email").value,
        message: document.getElementById("message").value,
        dzien1: document.getElementById("dzien1").value,
        dzien2: document.getElementById("dzien2").value,
        city: document.getElementById("citySearch").value // DODANE MIASTO
    };

    emailjs.send("service_ugho321", "template_rznbtts", templateParams)
        .then(function() {
            alert("Wiadomość została wysłana!");
            document.getElementById("contactForm").reset();
        }, function(error) {
            alert("Błąd wysyłania: " + JSON.stringify(error));
        });
});

// =================================================================
// 6. Start aplikacji
// =================================================================
init(); // Rozpoczynamy ładowanie miast