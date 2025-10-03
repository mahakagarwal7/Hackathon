
const translations = {
en: {
 mainTitle: "AfterShip Pro Tracker",
 mainSubtitle: "Enter your tracking number below to get the latest status.",
 trackingNumberLabel: "Tracking Number",
 trackButton: "Track Package",
 yourPackagesTitle: "Your Saved Packages",
 noPackages: "No packages saved yet.",
 invalidInput: "Please enter a valid tracking number.",
 fetchError: "Could not fetch tracking info. Please try again.",
remove: "Remove"
 },
es: {
 mainTitle: "AfterShip Pro Tracker",
 mainSubtitle: "Ingrese su número de seguimiento para ver el estado.",
 trackingNumberLabel: "Número de seguimiento",
 trackButton: "Rastrear paquete",
 yourPackagesTitle: "Tus paquetes guardados",
 noPackages: "Aún no hay paquetes guardados.",
 invalidInput: "Por favor, ingrese un número de seguimiento válido.",
 fetchError: "No se pudo obtener la información. Inténtalo de nuevo.",
 remove: "Eliminar"
 }
};

let currentLang = "en";


const onboardScreen = document.getElementById('onboard-screen');
const mainApp = document.getElementById('main-app');
const startBtn = document.getElementById('start-tracking-button');
const languageSelect = document.getElementById('language-select');
const mainTitle = document.getElementById('main-title');
const mainSubtitle = document.getElementById('main-subtitle');
const trackingNumberLabel = document.getElementById('tracking-number-label');
const trackingInput = document.getElementById('tracking-number');
const trackBtn = document.getElementById('track-button');
const buttonText = document.getElementById('button-text');
const loadingIndicator = document.getElementById('loading-indicator');
const messageArea = document.getElementById('message-area');
const savedPackagesSection = document.getElementById('saved-packages-section');
const savedPackageList = document.getElementById('saved-package-list');
const yourPackagesTitle = document.getElementById('your-packages-title');
const noPackagesMessage = document.getElementById('no-packages-message');


function setLanguage(lang) {
    currentLang = lang;
    mainTitle.textContent = translations[lang].mainTitle;
    mainSubtitle.textContent = translations[lang].mainSubtitle;
    trackingNumberLabel.textContent = translations[lang].trackingNumberLabel;
    buttonText.textContent = translations[lang].trackButton;
    yourPackagesTitle.textContent = translations[lang].yourPackagesTitle;
    noPackagesMessage.textContent = translations[lang].noPackages;
    renderSavedPackages();
}

function showMessage(msg, isError = true) {
    messageArea.textContent = msg;
    messageArea.style.color = isError ? "#e11d48" : "#059669";
}

function clearMessage() {
    messageArea.textContent = "";
}

function validateTrackingNumber(num) {
    
    return typeof num === "string" && /^[A-Za-z0-9]{8,}$/.test(num.trim());
}


function getSavedPackages() {
    try {
        return JSON.parse(localStorage.getItem('aftership_packages')) || [];
    } catch {
        return [];
    }
}

function savePackages(packages) {
    localStorage.setItem('aftership_packages', JSON.stringify(packages));
}


function renderSavedPackages() {
    const packages = getSavedPackages();
    savedPackageList.innerHTML = "";
    if (packages.length === 0) {
        noPackagesMessage.style.display = "block";
        noPackagesMessage.textContent = translations[currentLang].noPackages;
        return;
    }
    noPackagesMessage.style.display = "none";
    packages.forEach(pkg => {
        const item = document.createElement('div');
        item.className = "package-item";
        const info = document.createElement('span');
        info.className = "package-info";
        info.textContent = pkg.number + (pkg.status ? ` - ${pkg.status}` : "");
        const removeBtn = document.createElement('button');
        removeBtn.className = "remove-btn";
        removeBtn.textContent = translations[currentLang].remove;
        removeBtn.onclick = () => {
            removePackage(pkg.number);
        };
        item.appendChild(info);
        item.appendChild(removeBtn);
        savedPackageList.appendChild(item);
    });
}

function addPackage(pkg) {
    const packages = getSavedPackages();
    if (!packages.some(p => p.number === pkg.number)) {
        packages.unshift(pkg);
        savePackages(packages);
        renderSavedPackages();
    }
}

function removePackage(number) {
    let packages = getSavedPackages();
    packages = packages.filter(p => p.number !== number);
    savePackages(packages);
    renderSavedPackages();
}


async function fetchTrackingInfo(trackingNumber) {
    const apiKey = "YOUR_API_KEY_HERE";

    const url = `https://api.aftership.com/v4/trackings`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "aftership-api-key": apiKey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ tracking: { tracking_number: trackingNumber } })
        });
        
        if (!response.ok && response.status !== 400) {
            const errorData = await response.json();
            throw new Error(errorData.meta.message || "API error");
        }
       
        const data = await response.json();
        console.log(data)
        
        const tracking = data.data.tracking;
        return {
            number: tracking.tracking_number,
            status: tracking.tag || tracking.checkpoints?.slice(-1)[0]?.tag || "Unknown",
            lastUpdate: tracking.updated_at || new Date().toLocaleString()
        };
    } catch (err) {
        throw new Error("Failed to fetch tracking info");
    }
}


startBtn.onclick = () => {
    onboardScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
    setLanguage(currentLang);
    trackingInput.focus();
};

languageSelect.onchange = (e) => {
    setLanguage(e.target.value);
};

trackBtn.onclick = async () => {
    clearMessage();
    const trackingNumber = trackingInput.value.trim();
    if (!validateTrackingNumber(trackingNumber)) {
        showMessage(translations[currentLang].invalidInput, true);
        return;
    }
    trackBtn.disabled = true;
    loadingIndicator.classList.remove('hidden');
    buttonText.style.opacity = 0.5;

try {
 const trackingInfo = await fetchTrackingInfo(trackingNumber);
 addPackage(trackingInfo);
 showMessage("Tracking info updated!", false);
 trackingInput.value = "";
} catch (err) {
 showMessage(translations[currentLang].fetchError, true);
 } finally {
 trackBtn.disabled = false;
 loadingIndicator.classList.add('hidden');
 buttonText.style.opacity = 1;
 }
};


window.onload = () => {
    
    if (!localStorage.getItem('aftership_packages')) {
        const samplePackages = [
            { number: "9400111699000185933618", status: "Delivered" },
            { number: "1Z9999999999999999", status: "In Transit" },
        ];
        savePackages(samplePackages);
    }
 setLanguage(currentLang);
 renderSavedPackages();

 setTimeout(() => {
    trackBtn.disabled = false;
}, 5000);
};
