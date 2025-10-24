document.addEventListener('DOMContentLoaded', () => {

    // Initialiser AOS (Animate on Scroll)
    AOS.init({
        duration: 800, // Durée de l'animation en ms
        offset: 100,   // Décalage avant le déclenchement de l'animation
        once: true,    // L'animation ne se joue qu'une fois
        easing: 'ease-in-out', // Type d'animation
    });

    // --- Gestion du formulaire de Comptabilité ---
    const comptaForm = document.getElementById('compta-form');
    const comptaStatus = document.getElementById('compta-status');
    const csvFileInput = document.getElementById('csv-file');
    const invoiceFilesInput = document.getElementById('invoice-files');
    const comptaActionSelect = document.getElementById('compta-action');
    const comptaDownloadArea = document.getElementById('compta-download-area'); // Get the download area
    
    // Gestion de l'affichage conditionnel des champs de fichier selon l'action sélectionnée
    if (comptaActionSelect) {
        const invoiceFilesFormGroup = invoiceFilesInput.closest('.form-group');
        
        // Fonction pour mettre à jour l'interface selon l'action sélectionnée
        function updateFormFields() {
            if (comptaActionSelect.value === 'analyse_balance') {
                // Désactiver le champ des factures PDF pour "Analyser Balance"
                invoiceFilesInput.disabled = true;
                invoiceFilesInput.required = false;
                invoiceFilesFormGroup.classList.add('disabled');
                
                // Ajouter un message d'erreur
                let errorMsg = invoiceFilesFormGroup.querySelector('.error-message');
                if (!errorMsg) {
                    errorMsg = document.createElement('div');
                    errorMsg.className = 'error-message';
                    errorMsg.textContent = "Téléverser uniquement votre fichier de compte";
                    invoiceFilesFormGroup.appendChild(errorMsg);
                }
            } else {
                // Réactiver le champ pour les autres actions
                invoiceFilesInput.disabled = false;
                invoiceFilesInput.required = true;
                invoiceFilesFormGroup.classList.remove('disabled');
                
                // Supprimer le message d'erreur s'il existe
                const errorMsg = invoiceFilesFormGroup.querySelector('.error-message');
                if (errorMsg) {
                    errorMsg.remove();
                }
            }
        }
        
        // Appliquer la logique au chargement de la page
        updateFormFields();
        
        // Appliquer la logique à chaque changement du menu déroulant
        comptaActionSelect.addEventListener('change', updateFormFields);
    }

    if (comptaForm) {
        comptaForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Empêche l'envoi classique du formulaire
            showStatus(comptaStatus, 'Chargement en cours...', 'loading');
            clearDownloadArea(); // Clear previous download button if any

            // Récupérer les données du formulaire
            const formData = new FormData();
            formData.append('action', comptaActionSelect.value);
            formData.append('csv_file', csvFileInput.files[0]); // Prend le premier fichier CSV

            // Ajouter tous les fichiers de factures PDF
            for (const file of invoiceFilesInput.files) {
                formData.append('invoice_files', file); // Le backend recevra une liste de 'invoice_files'
            }

            // --- Envoi vers le backend (localhost) ---
            // !!! Adaptez le port et le chemin exact de votre API backend !!!
            const backendUrl = '/api/compta'; // Exemple: port 5000

            try {
                const response = await fetch(backendUrl, {
                    method: 'POST',
                    body: formData, // Pas besoin de 'Content-Type', le navigateur le définit pour FormData
                });

                if (response.ok) {
                    const result = await response.json(); // Attend une réponse JSON du backend

                    // Vérifier si la réponse contient du HTML (cas de l'analyse de balance)
                    if (result.is_html && result.html_content) {
                        console.log('Réponse du backend (compta): HTML reçu');
                        showStatus(comptaStatus, 'Analyse générée avec succès !', 'success');
                        
                        // Créer un bouton pour afficher/télécharger l'analyse HTML
                        createHtmlViewButton(result.html_content, 'analyse_financiere.html');
                    }
                    else if (result.csv_data) {
                        // Success and CSV data is present - code existant
                        console.log('Réponse du backend (compta):', result);
                        showStatus(comptaStatus, result.message || 'Traitement réussi ! Fichier CSV prêt.', 'success');
                        // Create and display download button
                        createDownloadButton(result.csv_data, 'resultat_compta.csv');
                    } 
                    else if (response.ok && !result.csv_data) {
                        // Success but no CSV data extracted (backend indicated potential issue)
                        console.warn('Réponse du backend (compta) - Pas de CSV:', result);
                        showStatus(comptaStatus, result.message || 'Traitement terminé, mais les données CSV n\'ont pas pu être extraites.', 'warning');
                        // Display raw analysis if available for debugging
                        if (result.analysis) {
                            displayRawAnalysis(result.analysis);
                        }
                    }
                    else {
                        // Erreur gérée par le backend
                        console.error('Erreur backend (compta):', result);
                        showStatus(comptaStatus, result.error || `Erreur ${response.status}: ${response.statusText}`, 'error');
                    }
                }
            } catch (error) {
                // Erreur réseau ou autre
                console.error('Erreur lors de l\'envoi (compta):', error);
                showStatus(comptaStatus, 'Erreur de connexion au serveur. Vérifiez que le backend est lancé.', 'error');
            }
        });
    }

    // --- Gestion du formulaire d'Explication de Document ---
    const docForm = document.getElementById('doc-form');
    const docStatus = document.getElementById('doc-status');
    const docFileInput = document.getElementById('doc-file');
    const explanationOutput = document.getElementById('explanation-output')?.querySelector('p'); // Cible le paragraphe intérieur

    if (docForm) {
        docForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (docStatus) showStatus(docStatus, 'Analyse en cours...', 'loading');
            if (explanationOutput) explanationOutput.innerHTML = '<em>Analyse en cours par Saména...</em>'; // Message d'attente

            const formData = new FormData();
            formData.append('document_file', docFileInput.files[0]);

            // !!! Adaptez le port et le chemin exact de votre API backend !!!
            const backendUrl = '/api/explain'; // Exemple: port 5000

            try {
                const response = await fetch(backendUrl, {
                    method: 'POST',
                    body: formData,
                });

                const result = await response.json();

                if (response.ok) {
                    // Succès
                    console.log('Réponse du backend (explain):', result);
                    
                    // Préparer le texte en remplaçant les # par des sauts de ligne
                    const explanation = result.explanation || 'Explication reçue.';
                    const paragraphs = explanation.split('#');
                    
                    // Vider d'abord le conteneur
                    if (explanationOutput) explanationOutput.innerHTML = '';
                    
                    // Afficher progressivement chaque paragraphe
                    let paragraphIndex = 0;
                    let charIndex = 0;
                    const speed = 20; // Vitesse d'affichage (ms)
                    
                    function typeWriter() {
                        if (paragraphIndex < paragraphs.length) {
                            const currentParagraph = paragraphs[paragraphIndex];
                            
                            if (charIndex === 0 && paragraphIndex > 0) {
                                // Ajouter un saut de ligne avant chaque nouveau paragraphe (sauf le premier)
                                const br = document.createElement('br');
                                if (explanationOutput) explanationOutput.appendChild(br);
                            }
                            
                            if (charIndex < currentParagraph.length) {
                                if (explanationOutput) explanationOutput.innerHTML += currentParagraph.charAt(charIndex);
                                charIndex++;
                                setTimeout(typeWriter, speed);
                            } else {
                                // Passage au paragraphe suivant
                                paragraphIndex++;
                                charIndex = 0;
                                setTimeout(typeWriter, speed * 3); // Pause plus longue entre les paragraphes
                            }
                        }
                    }
                    
                    typeWriter();
                    showStatus(docStatus, 'Explication générée avec succès !', 'success');
                } else {
                    // Erreur gérée par le backend
                    console.error('Erreur backend (explain):', result);
                    if (explanationOutput) explanationOutput.innerHTML = '<em>Impossible de générer l\'explication.</em>';
                    showStatus(docStatus, result.error || `Erreur ${response.status}: ${response.statusText}`, 'error');
                }
            } catch (error) {
                // Erreur réseau ou autre
                console.error('Erreur lors de l\'envoi (explain):', error);
                if (explanationOutput) explanationOutput.innerHTML = '<em>Erreur de connexion au serveur.</em>';
                showStatus(docStatus, 'Erreur de connexion au serveur.', 'error');
            }
        });
    }

    // Fonction utilitaire pour afficher les messages de statut
    function showStatus(element, message, type) {
        if (!element) return;
        element.textContent = message;
        element.className = `status-message ${type}`; // Applique la classe CSS correspondante
        // Optionally clear download area on error or loading
        if (type === 'error' || type === 'loading') {
            clearDownloadArea();
        }
    }

    // Function to create and add the download button
    function createDownloadButton(csvData, filename) {
        clearDownloadArea(); // Ensure no duplicates

        const button = document.createElement('button');
        button.className = 'download-button';
        button.textContent = `Télécharger ${filename}`;
        button.className = 'download-button'; // Add class for styling
        button.type = 'button'; // Prevent form submission if inside form

        button.addEventListener('click', () => {
            // Ensure proper UTF-8 encoding with BOM for Excel
            // UTF-8 BOM is \uFEFF
            const BOM = "\uFEFF";
            const csvWithBOM = BOM + csvData;
            
            // Create blob with UTF-8 encoding specified
            const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });

            // Create a link element
            const link = document.createElement('a');

            // Create a URL for the Blob
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);

            // Append the link to the body (required for Firefox)
            document.body.appendChild(link);

            // Programmatically click the link
            link.click();

            // Clean up: remove the link and revoke the URL
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });

        if (comptaDownloadArea) comptaDownloadArea.appendChild(button);
    }

    // Function to clear the download area
    function clearDownloadArea() {
        if (comptaDownloadArea) comptaDownloadArea.innerHTML = ''; // Remove all children
    }

    // Function to display raw analysis text (for debugging when CSV fails)
    function displayRawAnalysis(analysisText) {
        clearDownloadArea(); // Clear button area
        const pre = document.createElement('pre');
        pre.textContent = "Données brutes reçues (extraction CSV échouée):\n\n" + analysisText;
        pre.style.whiteSpace = 'pre-wrap'; // Wrap long lines
        pre.style.wordBreak = 'break-all'; // Break long words/lines
        pre.style.marginTop = '10px';
        pre.style.padding = '10px';
        pre.style.border = '1px solid #ccc';
        pre.style.backgroundColor = '#f9f9f9';
        if (comptaDownloadArea) comptaDownloadArea.appendChild(pre);
    }

    // Function to create an HTML view button
    function createHtmlViewButton(htmlContent, filename) {
        clearDownloadArea(); // Ensure no duplicates
        const viewButton = document.createElement('button');
        viewButton.className = 'download-button'; // Use the existing style from style.css
        viewButton.textContent = "Voir l'analyse financière";
        viewButton.className = 'download-button'; // Utiliser la même classe pour le style
        viewButton.type = 'button';
        
        viewButton.addEventListener('click', () => {
            // Ouvrir le HTML dans un nouvel onglet
            const newWindow = window.open();
            newWindow.document.write(htmlContent);
            newWindow.document.close();
        });
        
        const downloadButton = document.createElement('button');
        downloadButton.textContent = `Télécharger ${filename}`;
        downloadButton.className = 'download-button';
        downloadButton.style.marginTop = '10px';
        downloadButton.type = 'button';
        
        downloadButton.addEventListener('click', () => {
            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });
        
        if (comptaDownloadArea) {
            comptaDownloadArea.appendChild(viewButton);
            comptaDownloadArea.appendChild(downloadButton);
        }
    }

    // Vérifiez si l'élément canvas existe avant d'utiliser getContext
    const dataCanvas = document.getElementById('data-visualization');
    if (dataCanvas) {
        const dataCtx = dataCanvas.getContext('2d');
        // ...existing code for dataCanvas...
    }

    // Prospect (nouvelle idée de business)
        const businessIdeaForm = document.getElementById('business-idea-form');
        const businessIdeaInput = document.getElementById('business-idea');
        const prospectStatus = document.getElementById('prospect-status');
        const prospectQuestionsDiv = document.getElementById('prospect-questions');
        const questionStepDiv = document.getElementById('question-step');

        let prospectQuestions = [];
        let currentQuestion = 0;
        let userAnswers = [];

        if (businessIdeaForm) {
            businessIdeaForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                console.log("Formulaire soumis, envoi de la requête à l'API /api/prospect"); // DEBUG
                prospectStatus.textContent = "Analyse de votre idée en cours...";
                prospectStatus.className = "status-message loading";
                prospectQuestionsDiv.style.display = "none";
                questionStepDiv.innerHTML = "";
                userAnswers = [];
                currentQuestion = 0;

                const idea = businessIdeaInput.value.trim();
                if (!idea) {
                    prospectStatus.textContent = "Merci de décrire votre idée.";
                    prospectStatus.className = "status-message error";
                    return;
                }

                try {
                    // Appel API /api/prospect (POST)
                    console.log("Envoi de la requête fetch à /api/prospect?entreprise=" + encodeURIComponent(idea)); // DEBUG
                    const response = await fetch('/api/prospect?entreprise=', {
                        method: 'POST'
                    });
                    console.log("Réponse reçue de l'API, status:", response.status); // DEBUG
                    const result = await response.json ? await response.json() : {};
                    console.log("Contenu JSON reçu:", result); // DEBUG
                    if (response.ok && result && result.questions) {
                        prospectQuestions = result.questions;
                        prospectStatus.textContent = "Questions générées avec succès !";
                        prospectStatus.className = "status-message success";
                        showNextQuestion();
                    } else if (typeof result === "string") {
                        // Si l'API retourne directement un texte (fallback)
                        try {
                            const parsed = JSON.parse(result);
                            prospectQuestions = parsed.questions || [];
                            showNextQuestion();
                        } catch {
                            prospectStatus.textContent = "Erreur lors de la génération des questions.";
                            prospectStatus.className = "status-message error";
                        }
                    } else {
                        prospectStatus.textContent = "Erreur lors de la génération des questions.";
                        prospectStatus.className = "status-message error";
                    }
                } catch (e) {
                    console.error("Erreur lors de la requête fetch:", e); // DEBUG
                    prospectStatus.textContent = "Erreur de connexion au serveur.";
                    prospectStatus.className = "status-message error";
                }
            });
        }

        function showNextQuestion() {
            if (!prospectQuestions || currentQuestion >= prospectQuestions.length) {
                questionStepDiv.innerHTML = "<p><strong>Merci !</strong> Vos réponses ont bien été enregistrées.</p>";
                return;
            }
            prospectQuestionsDiv.style.display = "block";
            const question = prospectQuestions[currentQuestion];
            questionStepDiv.innerHTML = `
                <p>${question}</p>
                <form id="answer-form">
                    <input type="text" id="answer-input" required placeholder="Votre réponse...">
                    <button type="submit">Valider</button>
                </form>
            `;
            const answerForm = document.getElementById('answer-form');
            answerForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const answer = document.getElementById('answer-input').value.trim();
                if (answer) {
                    userAnswers.push({ question, answer });
                    currentQuestion++;
                    showNextQuestion();
                }
            });
        }
});