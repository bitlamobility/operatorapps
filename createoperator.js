const API_URL = "https://script.google.com/macros/s/AKfycbxYfyiL-Ns_VK1t0K37dnt5ryTLM9a5fH4FlKdOnBo3rbCNpFu9iIifuRqVWXy_mIAhGQ/exec";

function roleHandle(sessionemprole){
    if(sessionemprole=="appdeveloper"){
        $("#menu_dashboard").hide();
        $("#menu_download_script").hide();
    } else if(sessionemprole=="support"){
        $("#menu_download_script").hide();
        $("#menu_create_new_operator").hide();
        $("#menu_pushfile").hide();
        $("#menu_fileviewer").hide();
    }else if(sessionemprole == "maintainer") {
        $("#menu_download_script").hide();
        $("#menu_dashboard").hide();
    }
}

async function validateAndPreviewImage(inputId, requiredWidth, requiredHeight) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(`${inputId}-preview`);
    const error = document.getElementById(`${inputId}-error`);
    
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const img = new Image();
        
        img.onload = function() {
            if (img.width !== requiredWidth || img.height !== requiredHeight) {
                error.textContent = `Image dimensions must be ${requiredWidth}x${requiredHeight}px. Current: ${img.width}x${img.height}px`;
                error.style.display = 'block';
                preview.style.display = 'none';
                input.value = ''; // Clear the file input
            } else {
                error.style.display = 'none';
                preview.style.display = 'block';
                preview.src = img.src;
            }
        };
        
        img.src = URL.createObjectURL(file);
    }
}

async function validateSplashVideo(input) {
    const file = input.files[0];
    const feedbackDiv = document.getElementById("splash_video_feedback");

    // Reset feedback
    feedbackDiv.textContent = '';
    feedbackDiv.classList.remove('text-success', 'text-danger');

    if (!file) return;

    // Check file type
    if (file.type !== "video/mp4") {
        feedbackDiv.textContent = "Only MP4 format is allowed.";
        feedbackDiv.classList.add('text-danger');
        input.value = '';
        return;
    }

    // Check file size (< 2MB)
    if (file.size > 2 * 1024 * 1024) {
        feedbackDiv.textContent = "File size must be less than 2MB.";
        feedbackDiv.classList.add('text-danger');
        input.value = '';
        return;
    }

    // Check video dimensions
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = function() {
        URL.revokeObjectURL(video.src);

        if (video.videoWidth === 1080 && video.videoHeight === 1920) {
            feedbackDiv.textContent = "";
            feedbackDiv.classList.add('text-success');
        } else {
            feedbackDiv.textContent = `Invalid dimensions: ${video.videoWidth}x${video.videoHeight}. Required: 1080x1920px.`;
            feedbackDiv.classList.add('text-danger');
            input.value = '';
        }
    };

    video.onerror = function() {
        feedbackDiv.textContent = "Invalid video file.";
        feedbackDiv.classList.add('text-danger');
        input.value = '';
    };

    video.src = URL.createObjectURL(file);
}


async function old_checkExistingPR(repo, token, country, subdomain) {
    const response = await fetch(`https://api.github.com/repos/${repo}/pulls?state=open`, {
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    
    if (!response.ok) {
        throw new Error('Failed to check existing PRs');
    }

    const prs = await response.json();
    return prs.find(pr => {
        const branchPattern = new RegExp(`update-${country}-${subdomain}-\\d+`);
        return branchPattern.test(pr.head.ref);
    });
}

async function checkExistingPR(repo, token, folderPath, subdomain) {
    const response = await fetch(`https://api.github.com/repos/${repo}/pulls?state=open`, {
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    
    if (!response.ok) {
        throw new Error('Failed to check existing PRs');
    }

    const prs = await response.json();
    return prs.find(pr => {
        const branchPattern = new RegExp(`update-${folderPath}-${subdomain}-\\d+`);
        return branchPattern.test(pr.head.ref);
    });
}

async function oouploadFiles() {
    $("#loader").removeClass("d-none");
    let token;
    try {
        const tokenResponse = await fetch(`${API_URL}?isFetchToken=true`);
        if (!tokenResponse.ok) {
            throw new Error('Failed to fetch token');
        }
        const tokenData = await tokenResponse.json();
        
        // Check response code and extract token from the nested structure
        if (tokenData.code !== 200 || !tokenData.data?.token) {
            throw new Error(tokenData.message || 'Invalid token response');
        }
        token = tokenData.data.token;
    } catch (error) {
        document.getElementById('status').innerHTML = `<p class="error">Error fetching token: ${error.message}</p>`;
        $("#loader").addClass("d-none");
        return;
    }
    const repoUrl = "https://github.com/bitla-soft/operator-details";
    const country = document.getElementById('country').value;
    const subdomain = document.getElementById('subdomain').value;
    const prTitle = document.getElementById('pr-title').value;
    const prDescription = document.getElementById('pr-description').value;
    const statusDiv = document.getElementById('status');

    const repoMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!repoMatch) {
        statusDiv.innerHTML = '<p class="error">Invalid GitHub repository URL</p>';
        return;
    }
    const repo = `${repoMatch[1]}/${repoMatch[2].replace('.git', '')}`;

    try {
        // Check for existing PR
        const existingPR = await checkExistingPR(repo, token, country, subdomain);
        let branchName;
        
        if (existingPR) {
            branchName = existingPR.head.ref;
        } else {
            // Create new branch
            const masterRef = await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/master`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!masterRef.ok) throw new Error('Failed to get master branch reference');
            
            const masterData = await masterRef.json();
            
            branchName = `update-${country}-${subdomain}-${Date.now()}`;
            const createBranch = await fetch(`https://api.github.com/repos/${repo}/git/refs`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ref: `refs/heads/${branchName}`,
                    sha: masterData.object.sha
                })
            });

            if (!createBranch.ok) throw new Error('Failed to create new branch');
        }

        // Process each file
        const files = {
            'ic_launcher.png': document.getElementById('icon').files[0],
            'splash.png': document.getElementById('splash').files[0],
            'google-services.json': document.getElementById('google-services').files[0]
        };
        
        // Add keystore with original filename
        const keystoreFile = document.getElementById('keystore').files[0];
        if (keystoreFile) files[keystoreFile.name] = keystoreFile;

        // Filter out empty files
        const filesToUpload = Object.entries(files).filter(([_, file]) => file);

        for (const [filename, file] of filesToUpload) {
            const content = await readFileAsBase64(file);
            const path = `${country}/${subdomain}/${filename}`;
            
            // First, try to get existing file's SHA from both the branch and master
            let sha;
            try {
                // Check in the current branch first
                const branchCheck = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branchName}`, {
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (branchCheck.ok) {
                    const branchData = await branchCheck.json();
                    sha = branchData.sha;
                } else {
                    // If not in branch, check master
                    const masterCheck = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
                        headers: {
                            'Authorization': `token ${token}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    });
                    
                    if (masterCheck.ok) {
                        const masterData = await masterCheck.json();
                        sha = masterData.sha;
                    }
                }
            } catch (error) {
                console.error('Error checking file existence:', error);
            }

            // Upload file
            const uploadResponse = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: `Update ${filename} for ${subdomain}`,
                    content: content,
                    branch: branchName,
                    ...(sha && { sha }) // Only include sha if it exists
                })
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(`Error uploading ${filename}: ${errorData.message}`);
            }

            statusDiv.innerHTML += `<p class="success">Successfully uploaded ${filename}</p>`;
        }

        // Create or update PR
        const prBody = `${prDescription}`;
        
        if (existingPR) {
            // Update existing PR
            const updatePr = await fetch(`https://api.github.com/repos/${repo}/pulls/${existingPR.number}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: prTitle,
                    body: prBody,
                    assignees: ['souvikcbitla', 'Surjeet-Singh-Rathore']
                })
            });

            if (!updatePr.ok) throw new Error('Failed to update Pull Request');
            const prData = await updatePr.json();
            
            statusDiv.innerHTML += `
                <div class="pr-link">
                    <p class="success">✅ Pull Request updated successfully!</p>
                    <p>Review the changes here:</p>
                    <a href="${prData.html_url}" target="_blank">${prData.html_url}</a>
                </div>
            `;
        } else {
            // Create new PR
            const createPr = await fetch(`https://api.github.com/repos/${repo}/pulls`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: prTitle,
                    body: prBody,
                    head: branchName,
                    base: 'master',
                    assignees: ['souvikcbitla', 'Surjeet-Singh-Rathore']
                })
            });

            if (!createPr.ok) throw new Error('Failed to create Pull Request');
            const prData = await createPr.json();
            
            // Add assignees to the newly created PR
            const addAssignees = await fetch(`https://api.github.com/repos/${repo}/issues/${prData.number}/assignees`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    assignees: ['souvikcbitla', 'Surjeet-Singh-Rathore']
                })
            });

            if (!addAssignees.ok) {
                console.error('Failed to add assignees:', await addAssignees.json());
                // Continue execution even if assignee update fails
            }

            statusDiv.innerHTML += `
                <div class="pr-link">
                    <p class="success">✅ Pull Request created successfully!</p>
                    <p>Review the changes here:</p>
                    <a href="${prData.html_url}" target="_blank">${prData.html_url}</a>
                </div>
            `;
        }

        resetForm();

    } catch (error) {
        statusDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    }
    $("#loader").addClass("d-none");
}

async function uploadFiles() {
    $("#loader").removeClass("d-none");
    let token;
    try {
        const tokenResponse = await fetch(`${API_URL}?isFetchToken=true`);
        if (!tokenResponse.ok) {
            throw new Error('Failed to fetch token');
        }
        const tokenData = await tokenResponse.json();

        if (tokenData.code !== 200 || !tokenData.data?.token) {
            throw new Error(tokenData.message || 'Invalid token response');
        }
        token = tokenData.data.token;
    } catch (error) {
        document.getElementById('status').innerHTML = `<p class="error">Error fetching token: ${error.message}</p>`;
        $("#loader").addClass("d-none");
        return;
    }

    const repoUrl = "https://github.com/bitla-soft/operator-details";

    // Get the country from the PR form, not the Excel form
    const countrySelect = document.getElementById('pr-country');
    const country = countrySelect.value;

    // Convert country to folder path
    let folderPath;
    if (country === 'national') {
        folderPath = 'national';
    } else if (country === 'indonesia') {
        folderPath = 'indonesia';
    } else if (country === 'africa') {
        folderPath = 'africa';
    } else {
        document.getElementById('status').innerHTML = '<p class="error">Please select a valid country</p>';
        $("#loader").addClass("d-none");
        return;
    }

    // Read form fields
    let oldSubdomain = document.getElementById('subdomain').value.trim();
    let subdomain = oldSubdomain;
    const newSubdomainInput = document.getElementById('newSubdomain');
    const newSubdomain = newSubdomainInput?.value?.trim();

    if (newSubdomain && newSubdomain !== oldSubdomain) {
        subdomain = newSubdomain;
    }

    const prTitle = document.getElementById('pr-title').value;
    const prDescription = document.getElementById('pr-description').value;
    const statusDiv = document.getElementById('status');

    const repoMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!repoMatch) {
        statusDiv.innerHTML = '<p class="error">Invalid GitHub repository URL</p>';
        return;
    }
    const repo = `${repoMatch[1]}/${repoMatch[2].replace('.git', '')}`;

    try {
        // Check for existing PR - use correct folder path
        const existingPR = await checkExistingPR(repo, token, folderPath, oldSubdomain);
        let branchName;

        if (existingPR) {
            branchName = existingPR.head.ref;
        } else {
            // Create new branch with correct folder path
            const masterRef = await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/master`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!masterRef.ok) throw new Error('Failed to get master branch reference');

            const masterData = await masterRef.json();

            // Use folder path in branch name
            branchName = `update-${folderPath}-${subdomain}-${Date.now()}`;
            const createBranch = await fetch(`https://api.github.com/repos/${repo}/git/refs`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ref: `refs/heads/${branchName}`,
                    sha: masterData.object.sha
                })
            });

            if (!createBranch.ok) throw new Error('Failed to create new branch');
        }

        // If newSubdomain is provided and different, move folder contents
        if (newSubdomain && newSubdomain !== oldSubdomain) {
            const oldFolderPath = `${folderPath}/${oldSubdomain}`;
            const newFolderPath = `${folderPath}/${newSubdomain}`;

            const oldFilesResponse = await fetch(`https://api.github.com/repos/${repo}/contents/${oldFolderPath}?ref=${branchName}`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (oldFilesResponse.ok) {
                const oldFiles = await oldFilesResponse.json();

                for (const file of oldFiles) {
                    const filename = file.name;
                    const fileContentResponse = await fetch(file.download_url);
                    const blob = await fileContentResponse.blob();
                    const reader = new FileReader();
                    const base64 = await new Promise((resolve, reject) => {
                        reader.onloadend = () => resolve(reader.result.split(',')[1]);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });

                    const newPath = `${newFolderPath}/${filename}`;
                    await fetch(`https://api.github.com/repos/${repo}/contents/${newPath}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `token ${token}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            message: `Move ${filename} from ${oldSubdomain} to ${newSubdomain}`,
                            content: base64,
                            branch: branchName
                        })
                    });

                    await fetch(`https://api.github.com/repos/${repo}/contents/${oldFolderPath}/${filename}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `token ${token}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            message: `Delete old file ${filename} from ${oldSubdomain}`,
                            sha: file.sha,
                            branch: branchName
                        })
                    });

                    statusDiv.innerHTML += `<p class="success">Renamed ${filename} to new subdomain folder</p>`;
                }
            } else {
                statusDiv.innerHTML += `<p class="warning">Old subdomain folder not found. Skipping rename.</p>`;
            }
        }

        // Process each file
        const files = {
            'ic_launcher.png': document.getElementById('icon').files[0],
            'splash.png': document.getElementById('splash').files[0],
            'google-services.json': document.getElementById('google-services').files[0],
            'splash_video.mp4': document.getElementById('splash_video').files[0]
        };

        // Add keystore with original filename
        const keystoreFile = document.getElementById('keystore').files[0];
        if (keystoreFile) files[keystoreFile.name] = keystoreFile;

        // Filter out empty files
        const filesToUpload = Object.entries(files).filter(([_, file]) => file);

        for (const [filename, file] of filesToUpload) {
            const path = `${folderPath}/${subdomain}/${filename}`;
            const content = await readFileAsBase64(file);

            // Try to get existing file's SHA
            let sha;
            try {
                const branchCheck = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branchName}`, {
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });

                if (branchCheck.ok) {
                    const branchData = await branchCheck.json();
                    sha = branchData.sha;
                } else {
                    const masterCheck = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
                        headers: {
                            'Authorization': `token ${token}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    });

                    if (masterCheck.ok) {
                        const masterData = await masterCheck.json();
                        sha = masterData.sha;
                    }
                }
            } catch (error) {
                console.error('Error checking file existence:', error);
            }

            // Upload file
            const uploadResponse = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: `Update ${filename} for ${subdomain}`,
                    content: content,
                    branch: branchName,
                    ...(sha && { sha })
                })
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(`Error uploading ${filename}: ${errorData.message}`);
            }

            statusDiv.innerHTML += `<p class="success">Successfully uploaded ${filename}</p>`;
        }

        // Create or update PR
        const prBody = `${prDescription}`;

        if (existingPR) {
            const updatePr = await fetch(`https://api.github.com/repos/${repo}/pulls/${existingPR.number}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: prTitle,
                    body: prBody,
                    assignees: ['souvikcbitla', 'Surjeet-Singh-Rathore']
                })
            });

            if (!updatePr.ok) throw new Error('Failed to update Pull Request');
            const prData = await updatePr.json();

            statusDiv.innerHTML += `
                <div class="pr-link">
                    <p class="success">✅ Pull Request updated successfully!</p>
                    <p>Review the changes here:</p>
                    <a href="${prData.html_url}" target="_blank">${prData.html_url}</a>
                </div>
            `;
        } else {
            const createPr = await fetch(`https://api.github.com/repos/${repo}/pulls`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: prTitle,
                    body: prBody,
                    head: branchName,
                    base: 'master',
                    assignees: ['souvikcbitla', 'Surjeet-Singh-Rathore']
                })
            });

            if (!createPr.ok) throw new Error('Failed to create Pull Request');
            const prData = await createPr.json();

            // Add assignees after PR creation
            const addAssignees = await fetch(`https://api.github.com/repos/${repo}/issues/${prData.number}/assignees`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    assignees: ['souvikcbitla', 'Surjeet-Singh-Rathore']
                })
            });

            if (!addAssignees.ok) {
                console.error('Failed to add assignees:', await addAssignees.json());
            }

            statusDiv.innerHTML += `
                <div class="pr-link">
                    <p class="success">✅ Pull Request created successfully!</p>
                    <p>Review the changes here:</p>
                    <a href="${prData.html_url}" target="_blank">${prData.html_url}</a>
                </div>
            `;
        }

        resetForm();

    } catch (error) {
        statusDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    }
    $("#loader").addClass("d-none");
}



function resetForm() {
    // Reset select fields
    document.getElementById('country').value = '';
    
    // Reset text inputs
    document.getElementById('subdomain').value = '';
    document.getElementById('pr-title').value = 'Update app assets for MyApp';
    document.getElementById('pr-description').value = 'Update app assets Description';
    
    // Reset file inputs
    document.getElementById('icon').value = '';
    document.getElementById('splash').value = '';
    document.getElementById('keystore').value = '';
    document.getElementById('google-services').value = '';
    
    // Clear image previews
    document.getElementById('icon-preview').style.display = 'none';
    document.getElementById('splash-preview').style.display = 'none';
    
    // Clear file names
    document.getElementById('keystore-name').textContent = '';
    document.getElementById('google-services-name').textContent = '';
    
    // Clear error messages
    document.getElementById('icon-error').textContent = '';
    document.getElementById('splash-error').textContent = '';
    
    // Clear status messages after a delay
    setTimeout(() => {
        document.getElementById('status').innerHTML = '';
    }, 20000); // Clear after 20 seconds
}

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64String = reader.result
                .replace(/^data:.+;base64,/, '');
            resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function showFileName(inputId) {
    const input = document.getElementById(inputId);
    const nameDisplay = document.getElementById(`${inputId}-name`);
    const customLabel = input.nextElementSibling; // Gets the custom-file-label

    if (input.files && input.files[0]) {
        const fileName = input.files[0].name;
        // Update the custom file input label
        customLabel.textContent = fileName;
        // Show file name in the dedicated display area
        nameDisplay.innerHTML = `
            <div class="alert alert-success mt-2 mb-0">
                <i class="fas fa-check-circle mr-2"></i>
                Selected file: ${fileName}
            </div>`;
    } else {
        // Reset to default state
        customLabel.textContent = 'Choose file...';
        nameDisplay.textContent = '';
    }
}

$(document).ready(function() {
    
    $('[data-toggle="tooltip"]').tooltip();

    storedEmpId = sessionStorage.getItem("empid");
    sessionemptoken = sessionStorage.getItem("emptoken");
    sessionemprole = sessionStorage.getItem("emprole");

    roleHandle(sessionemprole);

    if (!storedEmpId || !sessionemptoken) {
        window.location.href = "index.html";
    }
    
    $("#logout").click(function(){
        sessionStorage.clear();
        window.location.href = "index.html";
    });


    $("#CreateForm").submit(function (event) {
        event.preventDefault(); // Prevent default form submission
        $('#loader').removeClass("d-none");
        $("#CreateForm button[type='submit']").prop('disabled', true);
        // Collect form data
        const formData = {
            operatorName: $("#operatorName").val(),       // Operator Name
            subDomain: $("#subDomain").val(),            // Sub Domain
            country: $("#country").val(),                // Country
            versionName: $("#version_name").val(),       // Version Name
            versionCode: $("#version_code").val(),       // Version Code
            packageName: $("#packageName").val(),        // Package Name
            developerName: $("#developerName").val(),    // Developer Name
            keyFile: $("#keyFile").val(),                // Key File Name
            aliasName: $("#aliasName").val(),            // Alias Name
            password: $("#password").val(),         // Key Password
            baseUrl: $("#baseUrl").val(),                // Base URL
            region: $("#region").val(),                  // Region
            playStoreLink: $("#playStoreLink").val(),    // Google Play Store Link
            playStoreUploadDate: $("#playstore_update_date").val(), // Play Store Upload Date
            analyticsEmail: $("#analyticsEmail").val(),  // Analytics Email ID
            analyticsProperty: $("#analyticsProperty").val(), // Analytics Property Name
            travelCode: $("#travelCode").val(), // Analytics Property Name
            websiteLink: $("#websiteLink").val(), // Website Link
            videoSplash: $("#videoSplash").val() // Analytics Property Name
        };
        const formDataString = JSON.stringify(formData);
        console.log(btoa(formDataString));
        const formDataBase64 = encodeURIComponent(btoa(formDataString));
        
        $.ajax({
            url: `${API_URL}?create_entry=true&authtoken=${sessionemptoken}&empid=${storedEmpId}&datahash=${formDataBase64}`,
            type: 'GET',
            success: function (response) {
                $("#UpdateForm button[type='submit']").prop('disabled', false);
                if(response.code == 200){
                    console.log(response);
                    //$('#loader').addClass("d-none");
                    alert(response.message);
                    window.location.reload();
                }else{
                    console.log(response.message);
                    alert(response.message);
                    $('#loader').addClass("d-none");
                }
                
            },
            error: function (xhr, status, error) {
                $("#UpdateForm button[type='submit']").prop('disabled', false);
                alert(`Error: ${error}`);
                console.log(`Error: ${error}`);
                $('#loader').addClass("d-none");
            }
        });
    });

    $('.custom-file-input').on('change', function() {
        const fileName = $(this).val().split('\\').pop();
        $(this).next('.custom-file-label').html(fileName || 'Choose file...');
    });
});