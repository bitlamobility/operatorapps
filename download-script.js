// Global Constants
const API_URL = "https://script.google.com/macros/s/AKfycbxYfyiL-Ns_VK1t0K37dnt5ryTLM9a5fH4FlKdOnBo3rbCNpFu9iIifuRqVWXy_mIAhGQ/exec";

$(document).ready(function () {
    // Session Check
    const storedEmpId = sessionStorage.getItem("empid");
    const sessionemptoken = sessionStorage.getItem("emptoken");
    const sessionemprole = sessionStorage.getItem("emprole");

    if (!storedEmpId || !sessionemptoken) {
        window.location.href = "index.html";
        return;
    }

    // Role-based menu visibility
    handleRoleVisibility(sessionemprole);

    // Logout Handler
    $("#logout").click(function(){
        sessionStorage.clear();
        window.location.href = "index.html";
    });

    // Form Submit Handler
    $('#fileForm').submit(function (e) {
        e.preventDefault();
        $('.scriptdiv').show();
        $(".otherdiv").hide();
    });

    // Initialize tooltips
    $('[data-toggle="tooltip"]').tooltip();

    // Initialize copy buttons
    initializeCopyButtons();
});

// Role-based visibility handler
function handleRoleVisibility(role) {
    if(role === "appdeveloper") {
        $("#menu_dashboard, #menu_download_script").hide();
    } else if(role === "support") {
        $("#menu_download_script, #menu_create_new_operator, #menu_pushfile, #menu_fileviewer").hide();
    } else if(role === "maintainer") {
        $("#menu_download_script, #menu_dashboard").hide();
    }
}

// Show Script Content in Modal
function showScript() {
    const system = $('#system').val();
    const projectPath = $('#projectPath').val();
    const androidFolderPath = $('#androidFolderPath').val();
    
    let scriptContent = system === "mac" ? macScript : linuxScript;
    
    // Replace placeholders
    scriptContent = scriptContent.replace(/ProjectPath=".*?"/, `ProjectPath="${projectPath}"`);
    scriptContent = scriptContent.replace(/androidFolderPath=".*?"/, `androidFolderPath="${androidFolderPath}"`);
    
    // Set token command based on system
    if(system === "linux") {
        scriptContent = scriptContent.replace(
            /TOKEN=".*?"/, 
            `TOKEN="$(secret-tool lookup account your_account service github_token)"`
        );
    } else {
        scriptContent = scriptContent.replace(
            /TOKEN=".*?"/, 
            `TOKEN="$(security find-generic-password -a your_account -s github_token -w)"`
        );
    }
    
    // Update modal content
    $('#scriptTypeTitle').text(`${system === "mac" ? "Mac" : "Linux"} Script Content`);
    $('#modalScriptContent').val(scriptContent);
    
    // Show modal
    $('#scriptModal').modal('show');
}

// Copy Script Content
function copyScript() {
    const scriptContent = $('#modalScriptContent').val();
    copyToClipboard(scriptContent, 'Script content');
}

// Copy Command to Clipboard
function copyCommand(commandType) {
    let command = '';
    let description = '';

    switch(commandType) {
        case 'mac-command':
            command = 'security add-generic-password -a your_account -s github_token -w "your_actual_token_here"';
            description = 'Mac command';
            break;
        case 'linux-command':
            command = 'secret-tool store --label="GitHub Token" account your_account service github_token';
            description = 'Linux command';
            break;
        case 'chmod-command':
            command = 'sudo chmod -R 755 {Navigate to script file}';
            description = 'chmod command';
            break;
        default:
            console.error('Unknown command type:', commandType);
            return;
    }

    copyToClipboard(command, description);
}

// Generic copy to clipboard function
function copyToClipboard(text, description) {
    navigator.clipboard.writeText(text)
        .then(() => {
            showCopySuccess(description);
        })
        .catch(err => {
            console.error('Failed to copy:', err);
            showCopyError(description);
        });
}

// Success toast/alert
function showCopySuccess(description) {
    // You can replace this with a toast notification
    alert(`${description} copied to clipboard!`);
}

// Error toast/alert
function showCopyError(description) {
    // You can replace this with a toast notification
    alert(`Failed to copy ${description.toLowerCase()}. Please try selecting and copying manually.`);
}

// Initialize copy buttons
function initializeCopyButtons() {
    $('.btn-copy').tooltip({
        title: 'Copy to clipboard',
        placement: 'top',
        trigger: 'hover'
    });
}

// Show loading spinner
function showLoader() {
    $('#loader').removeClass('d-none');
}

// Hide loading spinner
function hideLoader() {
    $('#loader').addClass('d-none');
}

// Validate form inputs
function validateForm() {
    const projectPath = $('#projectPath').val().trim();
    const androidFolderPath = $('#androidFolderPath').val().trim();
    
    if (!projectPath) {
        alert('Please enter the project path');
        return false;
    }
    
    if (!androidFolderPath) {
        alert('Please enter the Android folder path');
        return false;
    }
    
    return true;
}

// Reset form to initial state
function resetForm() {
    $('#fileForm')[0].reset();
    $('.scriptdiv').hide();
    $('.otherdiv').show();
}

// Error handler
function handleError(error) {
    console.error('Error:', error);
    hideLoader();
    alert('An error occurred. Please try again.');
}

// Document click handler for closing tooltips
$(document).on('click', function () {
    $('.tooltip').remove();
});

// Modal events
$('#scriptModal').on('hidden.bs.modal', function () {
    $('#modalScriptContent').val('');
});

// Window resize handler for responsive adjustments
$(window).resize(function() {
    if ($(window).width() < 768) {
        $('.modal-dialog').css('margin', '10px');
    } else {
        $('.modal-dialog').css('margin', '1.75rem auto');
    }
});