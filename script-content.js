// Script content stored in separate file
const macScript = `#!/bin/bash
    # *********************************************************************************************************
    # Required Software Installation 
        # sed command is not working in mac https://medium.com/@bramblexu/install-gnu-sed-on-mac-os-and-set-it-as-default-7c17ef1b8f64
        # which sed              
        # /usr/bin/sed
        # brew install gnu-sed
        # brew info gnu-sed
        # GNU "sed" has been installed as "gsed". If you need to use it as "sed", you can add a "gnubin" directory to your PATH from your bashrc like: PATH="/usr/local/opt/gnu-sed/libexec/gnubin:$PATH"
        # After installing gsed run this command  =>   source ~/.zshrc
        # --------------------------------------------------------------------------
        # brew install imagemagick  #--------------- Imagemagick need to install for convert the image
        # --------------------------------------------------------------------------
        # Gradle installation
        # --------------------------------------------------------------------------
        # curl -s "https://get.sdkman.io" | bash  (SDK Man install for gradle)
        # sdk list gradle
        # sdk install gradle 8.10
        # sdk use gradle 8.10
        # --------------------------------------------------------------------------
        # JDK 17 installation
        # --------------------------------------------------------------------------
        # brew install openjdk@17
        # brew install --cask android-platform-tools
        # echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
        # sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk
        # CPPFLAGS="-I/opt/homebrew/opt/openjdk@17/include"
    # *********************************************************************************************************
    
    # *********************************************************************************************************
    # Checking Requirements

        echo "====== Checking Requirements ====="
        
        # Check Git
        if ! command -v git &> /dev/null; then
            echo "Error: git is not installed"
            exit 1
        fi
        
        # Check Java
        if ! command -v java &> /dev/null; then
            echo "Error: Java is not installed"
            exit 1
        fi
        
        # Check Android SDK (assuming ANDROID_HOME is set)
        if [ -z "$ANDROID_HOME" ]; then
            echo "Error: ANDROID_HOME is not set"
            exit 1
        fi
    # *********************************************************************************************************

    # *********************************************************************************************************
    # Initial path setup from own computer
        # ProjectPath="/Users/mobility/Documents/OfficeProjects"
        ProjectPath="/Users/souvikchaudhury/Documents/OfficeProjects"
        # androidFolderPath="$ProjectPath/android/ts-operator-native"  # This is android repository path.
        # echo $androidFolderPath
        # exit
    # *********************************************************************************************************

    # *********************************************************************************************************
    # Variable Declaration

        buildRequired=1

        echo "Enter Build required no:"
        read buildRequired

        today=$(date +"%d-%m-%Y-%H-%M")  # Today d-m-y-h-m used for folder creation.

        # All Path Declaration. !Don't change this path.
        APKFolder="$ProjectPath/APKFile"
        # apkFileFolderPath="$APKFolder/$today"
        apkFileFolderPath="$APKFolder/$buildRequired"
        operatorDetailsFolderPath="$apkFileFolderPath/operator-details"  # This is opeartor details library path.
        androidProjectPath="$apkFileFolderPath/ts-operator-native"

        # androidProjectPath=$androidFolderPath

        androidResFolderPath="$androidProjectPath/app/src/main/res"
        androidReleaseFolderPath="$androidProjectPath/app/build/outputs/apk/release"
        androidReleaseBundleFolderPath="$androidProjectPath/app/build/outputs/bundle/release"

        iconFileName="ic_launcher.png"
        splashFileName="splash.png" 
        MYARRAY=()
       
        
        # ----------------------------------------------------------------------------------------------------------
        # Github Realted Settings
            OWNER="bitla-soft"  # GitHub username
            REPO="operator-details"  # Repository name
            BRANCH="master"  # Branch name            
            TOKEN="***REMOVED***"

            # ANDROID_PROJECT_BRANCH="master_live_34"  # Branch name
            echo "Enter Android Project Branch:"
            read ANDROID_PROJECT_BRANCH

            ANDROID_PROJECT_REPOSITORY="git@github.com:bitla-soft/ts-operator-native.git"  # Repository Name
        # ----------------------------------------------------------------------------------------------------------

    # *********************************************************************************************************

    # *********************************************************************************************************
    # APK File storage directory creation
        mkdir -p "$APKFolder"
        mkdir -p "$apkFileFolderPath"
    # *********************************************************************************************************

    # *********************************************************************************************************
    # Log File To store full process Log
        LOG_FILE_NAME="$apkFileFolderPath/script_log.txt"
        touch $LOG_FILE_NAME # Create File
        exec > >(tee -a "$LOG_FILE_NAME") 2>&1 # Excecuting and storing file
    # *********************************************************************************************************

    # *********************************************************************************************************
    # Customer App Project Copy 

        echo "====== Downloading Project ====="

        echo "Cloning project..."
        git clone -b "$ANDROID_PROJECT_BRANCH" "$ANDROID_PROJECT_REPOSITORY" "$androidProjectPath"
        
        if [ $? -ne 0 ]; then
            echo "Error: Failed to download project"
            exit 1
        fi

        if [ -d "$androidProjectPath" ]; then
            # Grant write permissions to the directory
            chmod -R u+w "$androidProjectPath"
            echo "Write permissions granted to $androidProjectPath."
        else
            echo "Directory $androidProjectPath does not exist."
        fi
    # *********************************************************************************************************  
    
    # *********************************************************************************************************
    # Call the curl command and save the output
        
        curlUrl="https://script.google.com/macros/s/AKfycbxYfyiL-Ns_VK1t0K37dnt5ryTLM9a5fH4FlKdOnBo3rbCNpFu9iIifuRqVWXy_mIAhGQ/exec?build_number=$buildRequired&is_from_script=true&fetch_entry=true"
        # Send the request and capture the output
        echo "Requesting URL: $curlUrl"
        response=$(curl --location "$curlUrl")

        # echo $response
        # exit
        # Check if the response is not empty
        if [[ -z "$response" ]]; then
            echo "Curl response is empty. Exiting..."
            exit 1
        fi

        # Split the response into an array by newlines (each line will be an array element)
        IFS=$'\n' read -r -d '' -a dataArray <<< "$response"

        # Verify the array length
        echo "Length of dataArray: ${#dataArray[@]}"
    # *********************************************************************************************************
    
    # *********************************************************************************************************
    # Funtion Declaration for build upload
        clean_project_cache() {
            echo "====== Cleaning Project Cache ====="
            
            # Clean specific build directories
            echo "Cleaning build directories..."
            rm -rf ./app/build/                  # Main app module
            rm -rf ./build/                      # Root project build
            
            # If you have additional modules, uncomment and modify these lines
            # rm -rf ./module1/build/            # Module 1
            # rm -rf ./module2/build/            # Module 2
            
            # Clean gradle cache specific to this project
            echo "Cleaning gradle cache..."
            rm -rf .gradle/
            
            # Clean app specific directories
            echo "Cleaning app specific directories..."
            rm -rf ./app/release/
            rm -rf ./app/debug/
            
            # Remove generated files only in project directory
            echo "Cleaning generated files..."
            find . -maxdepth 3 -name "*.iml" -delete
            find . -maxdepth 3 -name ".DS_Store" -delete
            
            echo "Cache cleanup completed"
        }

        # Function to build APK and Bundle
        build_release() {
            echo "====== Starting Release Build Process ====="
            
            # Clean project first
            echo "====== Executing Gradle Clean ====="
            ./gradlew clean --no-daemon
            
            # Clean app module specifically
            echo "====== Cleaning App Module ====="
            ./gradlew :app:clean --no-daemon
            
            # Build project
            echo "====== Building Project ====="
            ./gradlew build --no-daemon --parallel --max-workers=4
            
            # Generate Release Bundle and APK
            echo "====== Generating Release Bundle ====="
            ./gradlew :app:bundleRelease --no-daemon
            
            echo "====== Generating Release APK ====="
            ./gradlew :app:assembleRelease --no-daemon
            
            # Verify if files were generated
            if [ -d "app/build/outputs/bundle/release" ] || [ -d "app/build/outputs/apk/release" ]; then
                echo "====== Build Completed Successfully ====="
                APKGENERATEDSTATUS=1
                
                # Clean only specific intermediate directories
                echo "====== Cleaning Post-Build Cache ====="
                rm -rf ./app/build/intermediates/
                rm -rf ./app/build/tmp/
                rm -rf ./app/build/kotlin/
            else
                echo "====== Build Failed! ====="
                APKGENERATEDSTATUS=0
                # exit 1
            fi
        }

        # Function to verify project directory
        verify_project_directory() {
            if [ ! -f "gradlew" ] || [ ! -d "app" ]; then
                echo "Error: Not in an Android project directory!"
                echo "Please run this script from the root of your Android project."
                exit 1
            fi
        }
    # *********************************************************************************************************

    # *********************************************************************************************************
    # Main Process of Splash Icons, Building Gradle and Generate APK and BUNDLE

        for line in "${dataArray[@]}"
        do
            IFS=',' read -r isGenerate verNum verCode subdomain keystore aliasname keystorepass applicationId applicationName baseUrl selectCountry <<< "$line" #reading str as an array as tokens separated by IFS
            
                echo $line

                APKGENERATEDSTATUS=0 # 0 => Not generated  1=> Generated

                if [ "$selectCountry" == "A" ] || [ "$selectCountry" == "a" ]; then
                    GITHUB_FOLDER_PATH="africa/$subdomain" 
                    operatorDetailsPath="$operatorDetailsFolderPath/africa/$subdomain"

                    isafr="const val IS_AFRICA = 1"
                    gsed -i "/\ const val IS_AFRICA/c \ \ \ \ \ \ \ \ ${isafr}" $androidProjectPath/app/src/main/java/com/bitla/mba/tsoperator/api/APIClient.kt
                    indn="const val IS_INDONESIA = 0"
                    gsed -i "/\ const val IS_INDONESIA/c \ \ \ \ \ \ \ \ ${indn}" $androidProjectPath/app/src/main/java/com/bitla/mba/tsoperator/api/APIClient.kt
                    
                elif [ "$selectCountry" == "I" ] || [ "$selectCountry" == "i" ]; then
                    GITHUB_FOLDER_PATH="indonesia/$subdomain" 
                    operatorDetailsPath="$operatorDetailsFolderPath/indonesia/$subdomain"

                    isafr="const val IS_AFRICA = 0"
                    gsed -i "/\ const val IS_AFRICA/c \ \ \ \ \ \ \ \ ${isafr}" $androidProjectPath/app/src/main/java/com/bitla/mba/tsoperator/api/APIClient.kt
                    indn="const val IS_INDONESIA = 1"
                    gsed -i "/\ const val IS_INDONESIA/c \ \ \ \ \ \ \ \ ${indn}" $androidProjectPath/app/src/main/java/com/bitla/mba/tsoperator/api/APIClient.kt

                elif [ "$selectCountry" == "N" ] || [ "$selectCountry" == "n" ]; then
                    GITHUB_FOLDER_PATH="national/$subdomain" 
                    operatorDetailsPath="$operatorDetailsFolderPath/national/$subdomain"
                    
                    isafr="const val IS_AFRICA = 0"
                    gsed -i "/\ const val IS_AFRICA/c \ \ \ \ \ \ \ \ ${isafr}" $androidProjectPath/app/src/main/java/com/bitla/mba/tsoperator/api/APIClient.kt
                    indn="const val IS_INDONESIA = 0"
                    gsed -i "/\ const val IS_INDONESIA/c \ \ \ \ \ \ \ \ ${indn}" $androidProjectPath/app/src/main/java/com/bitla/mba/tsoperator/api/APIClient.kt
                fi
                

                echo -e "\n===========================================\nOperator Details\n"
                echo -e "Version : ${verNum}\nVersion Code : ${verCode}\nOperator Folder Name and Apk File Name (Subdomain): ${subdomain}"
                echo -e "Operator Folder Path: ${operatorDetailsPath}\nKeystore Name : ${keystore}\nAlias Name : ${aliasname}"
                echo -e "Keystore Password : ${keystorepass}\nApplication ID : ${applicationId}\nApplication name : ${applicationName}"
                echo -e "Base URL : ${baseUrl}\nKEY PATH : $operatorDetailsPath/$keystore\n==========================================="

    
                # ----------------------------------------------------------------------------------------------------------
                # Creating subdomain folder in Today's folder

                    mkdir -p "$operatorDetailsPath"
                    subdomainFolder="$apkFileFolderPath/$subdomain"
                    rm -rf $subdomainFolder
                    mkdir -p "$subdomainFolder"
                # ----------------------------------------------------------------------------------------------------------
                
                # ----------------------------------------------------------------------------------------------------------
                # Operator Details Fetch direct from GitHub
                
                    # GitHub API URL for listing folder contents
                    API_URL="https://api.github.com/repos/$OWNER/$REPO/contents/$GITHUB_FOLDER_PATH?ref=$BRANCH"

                    # Fetch the list of files in the folder
                    file_list=$(curl -s -H "Authorization: token $TOKEN" "$API_URL" | grep '"download_url"' | awk -F '"' '{print $4}')

                    # Download each file in the folder
                    for file_url in $file_list; do
                        # Encode spaces in the URL for downloading
                        encoded_file_url=$(echo "$file_url" | sed 's/ /%20/g')
                        encoded_file_name=$(basename "${encoded_file_url%%\?*}")
                        
                        # Decode %20 back to space for the original file name
                        original_file_name=$(echo "$encoded_file_name" | sed 's/%20/ /g')
                        
                        echo "Downloading $original_file_name..."
                        curl -L -H "Authorization: token $TOKEN" "$encoded_file_url" -o "$operatorDetailsPath/$encoded_file_name"
                        
                        # Rename the file to restore spaces
                        mv "$operatorDetailsPath/$encoded_file_name" "$operatorDetailsPath/$original_file_name"
                        echo "Renamed $encoded_file_name to $original_file_name."
                    done

                    # mkdir -p "$operatorDetailsPath" && cd "$operatorDetailsPath" && git init && git remote add origin git@github.com:bitla-soft/operator-details.git && git config core.sparseCheckout true && echo "$GITHUB_FOLDER_PATH/*" > .git/info/sparse-checkout && git pull --depth=1 --no-tags origin master && mv "$GITHUB_FOLDER_PATH/*" . && rm -rf national

                    # exit
                # ----------------------------------------------------------------------------------------------------------

                if test -d $operatorDetailsPath; then
                    
                    # ----------------------------------------------------------------------------------------------------------
                    # Replace files

                        # Replace Application id in the gradle file
                        gappl="applicationId \"${applicationId}\""
                        gsed -i "/applicationId /c \ \ \ \ \ \ \ \ ${gappl}" $androidProjectPath/app/build.gradle

                        # Replace Version code in the gradle file
                        vcappl="versionCode ${verCode}"
                        gsed -i "/versionCode /c \ \ \ \ \ \ \ \ ${vcappl}" $androidProjectPath/app/build.gradle

                        # Replace Version number in the gradle file
                        vnppl="versionName \"${verNum}\""
                        gsed -i "/versionName /c \ \ \ \ \ \ \ \ ${vnppl}" $androidProjectPath/app/build.gradle

                        # Replace Operator name in string.xml
                        vsnppl="<string name=\"app_name\">${applicationName}</string>"
                        gsed -i "/app_name/c \ \ \ \ ${vsnppl}" $androidProjectPath/app/src/main/res/values/strings.xml

                        # Replace Operator name in indonesia string.xml
                        gsed -i "/app_name/c \ \ \ \ ${vsnppl}" $androidProjectPath/app/src/main/res/values-in/strings.xml

                        #Replace Baseurl in APIClient.xml
                        baseu="const val BASE_URL: String = \"${baseUrl}\""
                        gsed -i "/const val BASE_URL/c \ \ \ \ \ \ \ \ ${baseu}" $androidProjectPath/app/src/main/java/com/bitla/mba/tsoperator/api/APIClient.kt
                        
                        #copy jks file in project/app folder 
                        cp -R "$operatorDetailsPath/$keystore" $androidProjectPath/app/

                        #Replace keystorePath id in the gradle file
                        keystorePath="storeFile file('$keystore')"
                        gsed -i "/storeFile /c \ \ \ \ \ \ \ \ ${keystorePath}" $androidProjectPath/app/build.gradle

                        #Replace Alias in the gradle file
                        keyAlias="keyAlias '$aliasname'"
                        gsed -i "/keyAlias /c \ \ \ \ \ \ \ \ ${keyAlias}" $androidProjectPath/app/build.gradle

                        #Replace Application id in the google json file
                        cp -R $operatorDetailsPath/google-services.json $androidProjectPath/app/google-services.json
                    # ----------------------------------------------------------------------------------------------------------

                    # ----------------------------------------------------------------------------------------------------------
                    # Operator specific changes (Chartered Bus, Chaturbedi Travels)
                        if [ "$subdomain" == "cbus" ]; then
                            baseus="const val IS_SPLASH_SHOW_WITH_LOGO = 1"
                            gsed -i "/const val IS_SPLASH_SHOW_WITH_LOGO/c \ \ \ \ \ \ \ \ ${baseus}" $androidProjectPath/app/src/main/java/com/bitla/mba/tsoperator/api/APIClient.kt
                        else
                            baseua="const val IS_SPLASH_SHOW_WITH_LOGO = 0"
                            gsed -i "/\ const val IS_SPLASH_SHOW_WITH_LOGO/c \ \ \ \ \ \ \ \ ${baseua}" $androidProjectPath/app/src/main/java/com/bitla/mba/tsoperator/api/APIClient.kt
                        fi

                        if [ "$subdomain" == "cbsl" ]; then
                            baseus="const val IS_VIDEO_SPLASH = 1"
                            gsed -i "/const val IS_VIDEO_SPLASH/c \ \ \ \ \ \ \ \ ${baseus}" $androidProjectPath/app/src/main/java/com/bitla/mba/tsoperator/api/APIClient.kt
                            mv $androidProjectPath/app/src/main/res/raw/splash_video.mp4 $androidProjectPath/app/src/main/res/raw/splash_video_bkp.mp4
                            cp -R $operatorDetailsPath/splash_video.mp4 $androidProjectPath/app/src/main/res/raw/splash_video.mp4
                        else
                            baseua="const val IS_VIDEO_SPLASH = 0"
                            gsed -i "/\ const val IS_VIDEO_SPLASH/c \ \ \ \ \ \ \ \ ${baseua}" $androidProjectPath/app/src/main/java/com/bitla/mba/tsoperator/api/APIClient.kt
                        fi
                    # ----------------------------------------------------------------------------------------------------------
            
                    # ----------------------------------------------------------------------------------------------------------
                    # Icon and splash screen generation and Copy to Project Folder

                        iconFileUrl="$operatorDetailsPath/$iconFileName"
                        splashFileUrl="$operatorDetailsPath/$splashFileName"
                        

                        mkdir -p $operatorDetailsPath/android/mipmap-xxxhdpi
                        mkdir -p $operatorDetailsPath/android/mipmap-xxhdpi
                        mkdir -p $operatorDetailsPath/android/mipmap-xhdpi
                        mkdir -p $operatorDetailsPath/android/mipmap-hdpi
                        mkdir -p $operatorDetailsPath/android/mipmap-mdpi

                        magick $iconFileUrl -resize 512x512 $operatorDetailsPath/playstore.png
                        magick $iconFileUrl -resize 192x192 $operatorDetailsPath/android/mipmap-xxxhdpi/$iconFileName
                        magick $iconFileUrl -resize 144x144 $operatorDetailsPath/android/mipmap-xxhdpi/$iconFileName
                        magick $iconFileUrl -resize 96x96 $operatorDetailsPath/android/mipmap-xhdpi/$iconFileName
                        magick $iconFileUrl -resize 72x72 $operatorDetailsPath/android/mipmap-hdpi/$iconFileName
                        magick $iconFileUrl -resize 48x48 $operatorDetailsPath/android/mipmap-mdpi/$iconFileName

                        magick $splashFileUrl -resize 75% $operatorDetailsPath/android/mipmap-xxhdpi/$splashFileName
                        magick $splashFileUrl -resize 50% $operatorDetailsPath/android/mipmap-xhdpi/$splashFileName
                        magick $splashFileUrl -resize 38% $operatorDetailsPath/android/mipmap-hdpi/$splashFileName
                        magick $splashFileUrl -resize 25% $operatorDetailsPath/android/mipmap-mdpi/$splashFileName
                    
                        cp $splashFileUrl $operatorDetailsPath/android/mipmap-xxxhdpi/$splashFileName
                        echo "Icon and splash generated"

                        cp -R $operatorDetailsPath/android/* $androidResFolderPath 
                        # Copy icon and splash from operators android folder to android res folder
                    # ----------------------------------------------------------------------------------------------------------
                    
                    # ----------------------------------------------------------------------------------------------------------
                    # Navigate to android directory for Build Generation
                        echo "====== Change Directory ====="
                        cd $androidProjectPath
                    # ----------------------------------------------------------------------------------------------------------
                    

                    # Verify we're in the right directory first
                    verify_project_directory

                    # Clean cache first
                    clean_project_cache

                    # Build release
                    build_release

                    # ----------------------------------------------------------------------------------------------------------
                    # Gradle Build

                        # echo "====== Gradle Build Commands ====="
                        # #Clean build folder and build cache
                        # echo "====== Gradle clean ====="
                        # ./gradlew clean
                        # echo "====== Gradle App clean ====="
                        # ./gradlew :app:clean
                        # echo "====== Gradle Sync ====="
                        # ./gradlew build
                    # ----------------------------------------------------------------------------------------------------------

                    # ----------------------------------------------------------------------------------------------------------
                    # Release APK and Bundle Generation
                        # echo "====== APK File Release ====="
                        # ./gradlew :app:bundleRelease
                        # ./gradlew :app:assembleRelease
                        # APKGENERATEDSTATUS=1
                    # ----------------------------------------------------------------------------------------------------------

                    # ----------------------------------------------------------------------------------------------------------
                    # .JKS / Keystore Generation
                        # echo $operatorDetailsPath/$keystore
                        # jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore $operatorDetailsPath/$keystore $androidReleaseFolderPath/app-release-unsigned.apk $aliasname <<< $keystorepass
                        # zipalign -v 4 $androidReleaseFolderPath/app-release-unsigned.apk $subdomain.apk
                        # zipalign -v 4 $androidReleaseFolderPath/app-release.apk $subdomain.apk
                        # cd $subdomain
                        # keytool -storepass android123 -keypass android123 -genkey -alias $aliasname -keyalg RSA -keysize 2048 -keystore $keystore -dname "CN=Bitla Software, OU=Bitla, O=Bitla Software, L=Bangalore, ST=Karnataka, C=IN"
                        # keytool -importkeystore -srckeystore $keystore -destkeystore $keystore -deststoretype pkcs12
                        # cd $operatorDetailsPath
                    # ----------------------------------------------------------------------------------------------------------
                    
                    # ----------------------------------------------------------------------------------------------------------
                    # Move APK and Bundle to Subdomain Folder
                        mv $androidReleaseFolderPath/app-release.apk $subdomainFolder/$subdomain.apk
                        mv $androidReleaseBundleFolderPath/app-release.aab $subdomainFolder/$subdomain.aab
                    # ----------------------------------------------------------------------------------------------------------

                    # ----------------------------------------------------------------------------------------------------------
                    # Clear .jks / Keystore file and Operator Details from project/app and Todays folder 
                    
                        rm -rf $androidProjectPath/app/$keystore
                        rm -rf $operatorDetailsFolderPath
                    # ----------------------------------------------------------------------------------------------------------

                    # ----------------------------------------------------------------------------------------------------------
                    # Operator specific Splash Video change to low quality
                        if [ "$subdomain" == "cbsl" ]; then
                            mv $androidProjectPath/app/src/main/res/raw/splash_video_bkp.mp4 $androidProjectPath/app/src/main/res/raw/splash_video.mp4
                        fi
                    # ----------------------------------------------------------------------------------------------------------

                    # ----------------------------------------------------------------------------------------------------------
                    # Update Subdomain and build number
                        endCurlUrl="https://script.google.com/macros/s/AKfycbxYfyiL-Ns_VK1t0K37dnt5ryTLM9a5fH4FlKdOnBo3rbCNpFu9iIifuRqVWXy_mIAhGQ/exec?build_number=$buildRequired&subdomain=$subdomain&is_from_script=true&update_entry=true"
                        # Send the request and capture the output
                        echo "Requesting URL: $endCurlUrl"
                        response=$(curl --location "$endCurlUrl")
                    # ----------------------------------------------------------------------------------------------------------

                else
                    echo -e "Operator subdomain not exists in directory.\n===========================================\n"
                fi

            # fi
        done
        
        rm -rf $androidProjectPath
    # *********************************************************************************************************
`;

const linuxScript = `#!/bin/bash
#!/bin/bash   

    # *********************************************************************************************************
    # Required Software Installation 
        # sed command is not working in mac https://medium.com/@bramblexu/install-gnu-sed-on-mac-os-and-set-it-as-default-7c17ef1b8f64
        # which sed              
        # /usr/bin/sed
        # brew install gnu-sed
        # brew info gnu-sed
        # GNU "sed" has been installed as "gsed". If you need to use it as "sed", you can add a "gnubin" directory to your PATH from your bashrc like: PATH="/usr/local/opt/gnu-sed/libexec/gnubin:$PATH"
        # After installing gsed run this command  =>   source ~/.zshrc
        # --------------------------------------------------------------------------
        # brew install imagemagick  #--------------- Imagemagick need to install for convert the image
        # --------------------------------------------------------------------------
        # Gradle installation
        # --------------------------------------------------------------------------
        # curl -s "https://get.sdkman.io" | bash  (SDK Man install for gradle)
        # sdk list gradle
        # sdk install gradle 8.10
        # sdk use gradle 8.10
        # --------------------------------------------------------------------------
        # JDK 17 installation
        # --------------------------------------------------------------------------
        # brew install openjdk@17
        # brew install --cask android-platform-tools
        # echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
        # sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk
        # CPPFLAGS="-I/opt/homebrew/opt/openjdk@17/include"
    # *********************************************************************************************************

    # *********************************************************************************************************
    # Checking Requirements

        echo "====== Checking Requirements ====="
        
        # Check Git
        if ! command -v git &> /dev/null; then
            echo "Error: git is not installed"
            exit 1
        fi
        
        # Check Java
        if ! command -v java &> /dev/null; then
            echo "Error: Java is not installed"
            exit 1
        fi
        
        # Check Android SDK (assuming ANDROID_HOME is set)
        if [ -z "$ANDROID_HOME" ]; then
            echo "Error: ANDROID_HOME is not set"
            exit 1
        fi
    # *********************************************************************************************************

    # *********************************************************************************************************
    # Initial path setup from own computer

          ProjectPath="/home/bitlasoft/Documents"
        # ProjectPath="/Users/omprakash/Documents/officeWorkspace"
        androidFolderPath="$ProjectPath/ts-operator-native"  # This is android repository path.
        echo $androidFolderPath
        # exit
    # *********************************************************************************************************

    # *********************************************************************************************************
    # Variable Declaration

        buildRequired=1

        echo "Enter Build required no:"
        read buildRequired

        today=$(date +"%d-%m-%Y-%H-%M")  # Today d-m-y-h-m used for folder creation.

        # All Path Declaration. !Don't change this path.
        APKFolder="$ProjectPath/APKFile"
        # apkFileFolderPath="$APKFolder/$today"
        apkFileFolderPath="$APKFolder/$buildRequired"
        operatorDetailsFolderPath="$apkFileFolderPath/operator-details"  # This is opeartor details library path.
        androidProjectPath="$apkFileFolderPath/ts-operator-native"

        #androidProjectPath=$androidFolderPath

        androidResFolderPath="$androidProjectPath/app/src/main/res"
        androidReleaseFolderPath="$androidProjectPath/app/build/outputs/apk/release"
        androidReleaseBundleFolderPath="$androidProjectPath/app/build/outputs/bundle/release"

        iconFileName="ic_launcher.png"
        splashFileName="splash.png" 
        MYARRAY=()
       
        
        # ----------------------------------------------------------------------------------------------------------
        # Github Realted Settings
            OWNER="bitla-soft"  # GitHub username
            REPO="operator-details"  # Repository name
            BRANCH="master"  # Branch name            
            TOKEN="***REMOVED***"

            echo "Enter Android Project Branch:"
            read ANDROID_PROJECT_BRANCH

            # ANDROID_PROJECT_BRANCH="master_live_34"  # Branch name
            ANDROID_PROJECT_REPOSITORY="git@github.com:bitla-soft/ts-operator-native.git"  # Repository Name
        # ----------------------------------------------------------------------------------------------------------

    # *********************************************************************************************************

    # *********************************************************************************************************
    # APK File storage directory creation
        mkdir -p "$APKFolder"
        mkdir -p "$apkFileFolderPath"
    # *********************************************************************************************************

    # *********************************************************************************************************
    # Log File To store full process Log
        LOG_FILE_NAME="$apkFileFolderPath/script_log.txt"
        touch $LOG_FILE_NAME # Create File
        exec > >(tee -a "$LOG_FILE_NAME") 2>&1 # Excecuting and storing file
    # *********************************************************************************************************

    # *********************************************************************************************************
    # Customer App Project Copy 

        echo "====== Downloading Project ====="

        echo "Cloning project..."
        git clone -b "$ANDROID_PROJECT_BRANCH" "$ANDROID_PROJECT_REPOSITORY" "$androidProjectPath"
        
        if [ $? -ne 0 ]; then
            echo "Error: Failed to download project"
            exit 1
        fi

        if [ -d "$androidProjectPath" ]; then
            # Grant write permissions to the directory
            chmod -R u+w "$androidProjectPath"
            echo "Write permissions granted to $androidProjectPath."
        else
            echo "Directory $androidProjectPath does not exist."
        fi
    # *********************************************************************************************************   

    # *********************************************************************************************************
    # Call the curl command and save the output
        
        # curlUrl="https://script.google.com/macros/s/AKfycbznneUz0Qfj6-pJ6YJ0NtmrslwOGFhOtsGCusqVXBIcS--TUQvHPdo6QzOdFwgQz5sk/exec?is_json=false&empid=BS1614&user_agent=script&build_required=$buildRequired"
        curlUrl="https://script.google.com/macros/s/AKfycbxYfyiL-Ns_VK1t0K37dnt5ryTLM9a5fH4FlKdOnBo3rbCNpFu9iIifuRqVWXy_mIAhGQ/exec?build_number=$buildRequired&is_from_script=true&fetch_entry=true"
        # Send the request and capture the output
        echo "Requesting URL: $curlUrl"
        response=$(curl --location "$curlUrl")

        # Check if the response is not empty
        if [[ -z "$response" ]]; then
            echo "Curl response is empty. Exiting..."
            exit 1
        fi

        # Split the response into an array by newlines (each line will be an array element)
        IFS=$'\n' read -r -d '' -a dataArray <<< "$response"

        # Verify the array length
        echo "Length of dataArray: ${#dataArray[@]}"
    # *********************************************************************************************************
    
    # *********************************************************************************************************
    # Funtion Declaration for build upload
        clean_project_cache() {
            echo "====== Cleaning Project Cache ====="
            
            # Clean specific build directories
            echo "Cleaning build directories..."
            rm -rf ./app/build/                  # Main app module
            rm -rf ./build/                      # Root project build
            
            # If you have additional modules, uncomment and modify these lines
            # rm -rf ./module1/build/            # Module 1
            # rm -rf ./module2/build/            # Module 2
            
            # Clean gradle cache specific to this project
            echo "Cleaning gradle cache..."
            rm -rf .gradle/
            
            # Clean app specific directories
            echo "Cleaning app specific directories..."
            rm -rf ./app/release/
            rm -rf ./app/debug/
            
            # Remove generated files only in project directory
            echo "Cleaning generated files..."
            find . -maxdepth 3 -name "*.iml" -delete
            find . -maxdepth 3 -name ".DS_Store" -delete
            
            echo "Cache cleanup completed"
        }

        # Function to build APK and Bundle
        build_release() {
            echo "====== Starting Release Build Process ====="
            
            # Clean project first
            echo "====== Executing Gradle Clean ====="
            ./gradlew clean --no-daemon
            
            # Clean app module specifically
            echo "====== Cleaning App Module ====="
            ./gradlew :app:clean --no-daemon
            
            # Build project
            echo "====== Building Project ====="
            ./gradlew build --no-daemon --parallel --max-workers=4
            
            # Generate Release Bundle and APK
            echo "====== Generating Release Bundle ====="
            ./gradlew :app:bundleRelease --no-daemon
            
            echo "====== Generating Release APK ====="
            ./gradlew :app:assembleRelease --no-daemon
            
            # Verify if files were generated
            if [ -d "app/build/outputs/bundle/release" ] || [ -d "app/build/outputs/apk/release" ]; then
                echo "====== Build Completed Successfully ====="
                APKGENERATEDSTATUS=1
                
                # Clean only specific intermediate directories
                echo "====== Cleaning Post-Build Cache ====="
                rm -rf ./app/build/intermediates/
                rm -rf ./app/build/tmp/
                rm -rf ./app/build/kotlin/
            else
                echo "====== Build Failed! ====="
                APKGENERATEDSTATUS=0
                exit 1
            fi
        }

        # Function to verify project directory
        verify_project_directory() {
            if [ ! -f "gradlew" ] || [ ! -d "app" ]; then
                echo "Error: Not in an Android project directory!"
                echo "Please run this script from the root of your Android project."
                exit 1
            fi
        }
    # *********************************************************************************************************

    # *********************************************************************************************************
    # Main Process of Splash Icons, Building Gradle and Generate APK and BUNDLE

        for line in "${dataArray[@]}"
        do
            IFS=',' read -r isGenerate verNum verCode subdomain keystore aliasname keystorepass applicationId applicationName baseUrl selectCountry <<< "$line" #reading str as an array as tokens separated by IFS
            
                echo $line

                APKGENERATEDSTATUS=0 # 0 => Not generated  1=> Generated

                if [ "$selectCountry" == "A" ] || [ "$selectCountry" == "a" ]; then
                    GITHUB_FOLDER_PATH="africa/$subdomain" 
                    operatorDetailsPath="$operatorDetailsFolderPath/africa/$subdomain"

                    isafr="const val IS_AFRICA = 1"
                    sed -i "/\ const val IS_AFRICA/c \ \ \ \ \ \ \ \ ${isafr}" $androidProjectPath/app/src/main/java/com/bitla/mba/tsoperator/api/APIClient.kt
                    indn="const val IS_INDONESIA = 0"
                    sed -i "/\ const val IS_INDONESIA/c \ \ \ \ \ \ \ \ ${indn}" $androidProjectPath/app/src/main/java/com/bitla/mba/tsoperator/api/APIClient.kt
                    
                elif [ "$selectCountry" == "I" ] || [ "$selectCountry" == "i" ]; then
                    GITHUB_FOLDER_PATH="indonesia/$subdomain" 
                    operatorDetailsPath="$operatorDetailsFolderPath/indonesia/$subdomain"

                    isafr="const val IS_AFRICA = 0"
                    sed -i "/\ const val IS_AFRICA/c \ \ \ \ \ \ \ \ ${isafr}" $androidProjectPath/app/src/main/java/com/bitla/mba/tsoperator/api/APIClient.kt
                    indn="const val IS_INDONESIA = 1"
                    sed -i "/\ const val IS_INDONESIA/c \ \ \ \ \ \ \ \ ${indn}" $androidProjectPath/app/src/main/java/com/bitla/mba/tsoperator/api/APIClient.kt

                elif [ "$selectCountry" == "N" ] || [ "$selectCountry" == "n" ]; then
                    GITHUB_FOLDER_PATH="national/$subdomain" 
                    operatorDetailsPath="$operatorDetailsFolderPath/national/$subdomain"
                    
                    isafr="const val IS_AFRICA = 0"
                    sed -i "/\ const val IS_AFRICA/c \ \ \ \ \ \ \ \ ${isafr}" $androidProjectPath/app/src/main/java/com/bitla/mba/tsoperator/api/APIClient.kt
                    indn="const val IS_INDONESIA = 0"
                    sed -i "/\ const val IS_INDONESIA/c \ \ \ \ \ \ \ \ ${indn}" $androidProjectPath/app/src/main/java/com/bitla/mba/tsoperator/api/APIClient.kt
                fi
                

                echo -e "\n===========================================\nOperator Details\n"
                echo -e "Version : ${verNum}\nVersion Code : ${verCode}\nOperator Folder Name and Apk File Name (Subdomain): ${subdomain}"
                echo -e "Operator Folder Path: ${operatorDetailsPath}\nKeystore Name : ${keystore}\nAlias Name : ${aliasname}"
                echo -e "Keystore Password : ${keystorepass}\nApplication ID : ${applicationId}\nApplication name : ${applicationName}"
                echo -e "Base URL : ${baseUrl}\nKEY PATH : $operatorDetailsPath/$keystore\n==========================================="

    
                # ----------------------------------------------------------------------------------------------------------
                # Creating subdomain folder in Today's folder

                    mkdir -p "$operatorDetailsPath"
                    subdomainFolder="$apkFileFolderPath/$subdomain"
                    rm -rf $subdomainFolder
                    mkdir -p "$subdomainFolder"
                # ----------------------------------------------------------------------------------------------------------
                
                # ----------------------------------------------------------------------------------------------------------
                # Operator Details Fetch direct from GitHub
                
                    # GitHub API URL for listing folder contents
                    API_URL="https://api.github.com/repos/$OWNER/$REPO/contents/$GITHUB_FOLDER_PATH?ref=$BRANCH"

                    # Fetch the list of files in the folder
                    file_list=$(curl -s -H "Authorization: token $TOKEN" "$API_URL" | grep '"download_url"' | awk -F '"' '{print $4}')

                    # Download each file in the folder
                    for file_url in $file_list; do
                        # Encode spaces in the URL for downloading
                        encoded_file_url=$(echo "$file_url" | sed 's/ /%20/g')
                        encoded_file_name=$(basename "${encoded_file_url%%\?*}")
                        
                        # Decode %20 back to space for the original file name
                        original_file_name=$(echo "$encoded_file_name" | sed 's/%20/ /g')
                        
                        echo "Downloading $original_file_name..."
                        curl -L -H "Authorization: token $TOKEN" "$encoded_file_url" -o "$operatorDetailsPath/$encoded_file_name"
                        
                        # Rename the file to restore spaces
                        mv "$operatorDetailsPath/$encoded_file_name" "$operatorDetailsPath/$original_file_name"
                        echo "Renamed $encoded_file_name to $original_file_name."
                    done
                # exit
                # ----------------------------------------------------------------------------------------------------------

                if test -d $operatorDetailsPath; then
                    
                    # ----------------------------------------------------------------------------------------------------------
                    # Replace files

                        # Replace Application id in the gradle file
                        gappl="applicationId \"${applicationId}\""
                        sed -i "/applicationId /c \ \ \ \ \ \ \ \ ${gappl}" $androidProjectPath/app/build.gradle

                        # Replace Version code in the gradle file
                        vcappl="versionCode ${verCode}"
                        sed -i "/versionCode /c \ \ \ \ \ \ \ \ ${vcappl}" $androidProjectPath/app/build.gradle

                        # Replace Version number in the gradle file
                        vnppl="versionName \"${verNum}\""
                        sed -i "/versionName /c \ \ \ \ \ \ \ \ ${vnppl}" $androidProjectPath/app/build.gradle

                        # Replace Operator name in string.xml
                        vsnppl="<string name=\"app_name\">${applicationName}</string>"
                        sed -i "/app_name/c \ \ \ \ ${vsnppl}" $androidProjectPath/app/src/main/res/values/strings.xml

                        # Replace Operator name in indonesia string.xml
                        sed -i "/app_name/c \ \ \ \ ${vsnppl}" $androidProjectPath/app/src/main/res/values-in/strings.xml

                        #Replace Baseurl in APIClient.xml
                        baseu="const val BASE_URL: String = \"${baseUrl}\""
                        sed -i "/const val BASE_URL/c \ \ \ \ \ \ \ \ ${baseu}" $androidProjectPath/app/src/main/java/com/bitla/mba/tsoperator/api/APIClient.kt
                        
                        #copy jks file in project/app folder 
                        cp -R "$operatorDetailsPath/$keystore" $androidProjectPath/app/

                        #Replace keystorePath id in the gradle file
                        keystorePath="storeFile file('$keystore')"
                        sed -i "/storeFile /c \ \ \ \ \ \ \ \ ${keystorePath}" $androidProjectPath/app/build.gradle

                        #Replace Alias in the gradle file
                        keyAlias="keyAlias '$aliasname'"
                        sed -i "/keyAlias /c \ \ \ \ \ \ \ \ ${keyAlias}" $androidProjectPath/app/build.gradle

                        #Replace Application id in the google json file
                        cp -R $operatorDetailsPath/google-services.json $androidProjectPath/app/google-services.json
                    # ----------------------------------------------------------------------------------------------------------

                    # ----------------------------------------------------------------------------------------------------------
                    # Operator specific changes (Chartered Bus, Chaturbedi Travels)
                        if [ "$subdomain" == "cbus" ]; then
                            baseus="const val IS_SPLASH_SHOW_WITH_LOGO = 1"
                            sed -i "/const val IS_SPLASH_SHOW_WITH_LOGO/c \ \ \ \ \ \ \ \ ${baseus}" $androidProjectPath/app/src/main/java/com/bitla/mba/tsoperator/api/APIClient.kt
                        else
                            baseua="const val IS_SPLASH_SHOW_WITH_LOGO = 0"
                            sed -i "/\ const val IS_SPLASH_SHOW_WITH_LOGO/c \ \ \ \ \ \ \ \ ${baseua}" $androidProjectPath/app/src/main/java/com/bitla/mba/tsoperator/api/APIClient.kt
                        fi

                        if [ "$subdomain" == "cbsl" ]; then
                            baseus="const val IS_VIDEO_SPLASH = 1"
                            sed -i "/const val IS_VIDEO_SPLASH/c \ \ \ \ \ \ \ \ ${baseus}" $androidProjectPath/app/src/main/java/com/bitla/mba/tsoperator/api/APIClient.kt
                            mv $androidProjectPath/app/src/main/res/raw/splash_video.mp4 $androidProjectPath/app/src/main/res/raw/splash_video_bkp.mp4
                            cp -R $operatorDetailsPath/splash_video.mp4 $androidProjectPath/app/src/main/res/raw/splash_video.mp4
                        else
                            baseua="const val IS_VIDEO_SPLASH = 0"
                            sed -i "/\ const val IS_VIDEO_SPLASH/c \ \ \ \ \ \ \ \ ${baseua}" $androidProjectPath/app/src/main/java/com/bitla/mba/tsoperator/api/APIClient.kt
                        fi
                    # ----------------------------------------------------------------------------------------------------------
            
                    # ----------------------------------------------------------------------------------------------------------
                    # Icon and splash screen generation and Copy to Project Folder

                        iconFileUrl="$operatorDetailsPath/$iconFileName"
                        splashFileUrl="$operatorDetailsPath/$splashFileName"
                        

                        mkdir -p $operatorDetailsPath/android/mipmap-xxxhdpi
                        mkdir -p $operatorDetailsPath/android/mipmap-xxhdpi
                        mkdir -p $operatorDetailsPath/android/mipmap-xhdpi
                        mkdir -p $operatorDetailsPath/android/mipmap-hdpi
                        mkdir -p $operatorDetailsPath/android/mipmap-mdpi

                        # echo "magick convert $iconFileUrl -resize 512x512 $operatorDetailsPath/playstore.png"
                        # exit;

                        convert $iconFileUrl -resize 512x512 $operatorDetailsPath/playstore.png
                        convert $iconFileUrl -resize 192x192 $operatorDetailsPath/android/mipmap-xxxhdpi/$iconFileName
                        convert $iconFileUrl -resize 144x144 $operatorDetailsPath/android/mipmap-xxhdpi/$iconFileName
                        convert $iconFileUrl -resize 96x96 $operatorDetailsPath/android/mipmap-xhdpi/$iconFileName
                        convert $iconFileUrl -resize 72x72 $operatorDetailsPath/android/mipmap-hdpi/$iconFileName
                        convert $iconFileUrl -resize 48x48 $operatorDetailsPath/android/mipmap-mdpi/$iconFileName

                        convert $splashFileUrl -resize 75% $operatorDetailsPath/android/mipmap-xxhdpi/$splashFileName
                        convert $splashFileUrl -resize 50% $operatorDetailsPath/android/mipmap-xhdpi/$splashFileName
                        convert $splashFileUrl -resize 38% $operatorDetailsPath/android/mipmap-hdpi/$splashFileName
                        convert $splashFileUrl -resize 25% $operatorDetailsPath/android/mipmap-mdpi/$splashFileName
                    
                        cp $splashFileUrl $operatorDetailsPath/android/mipmap-xxxhdpi/$splashFileName
                        echo "Icon and splash generated"

                        cp -R $operatorDetailsPath/android/* $androidResFolderPath # Copy icon and splash from operators android folder to android res folder
                    # ----------------------------------------------------------------------------------------------------------
                    
                    # ----------------------------------------------------------------------------------------------------------
                    # Navigate to android directory for Build Generation
                        echo "====== Change Directory ====="
                        cd $androidProjectPath
                    # ----------------------------------------------------------------------------------------------------------


                    # Verify we're in the right directory first
                    verify_project_directory

                    # Clean cache first
                    clean_project_cache

                    # Build release
                    build_release

                    # ----------------------------------------------------------------------------------------------------------
                    # Gradle Build

                        # echo "====== Gradle Build Commands ====="
                        # #Clean build folder and build cache
                        # echo "====== Gradle clean ====="
                        # ./gradlew clean
                        # echo "====== Gradle App clean ====="
                        # ./gradlew :app:clean
                        # echo "====== Gradle Sync ====="
                        # ./gradlew build
                    # ----------------------------------------------------------------------------------------------------------

                    # ----------------------------------------------------------------------------------------------------------
                    # Release APK and Bundle Generation
                        # echo "====== APK File Release ====="
                        # ./gradlew :app:bundleRelease
                        # ./gradlew :app:assembleRelease
                        # APKGENERATEDSTATUS=1
                    # ----------------------------------------------------------------------------------------------------------

                    # ----------------------------------------------------------------------------------------------------------
                    # .JKS / Keystore Generation
                        # echo $operatorDetailsPath/$keystore
                        # jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore $operatorDetailsPath/$keystore $androidReleaseFolderPath/app-release-unsigned.apk $aliasname <<< $keystorepass
                        # zipalign -v 4 $androidReleaseFolderPath/app-release-unsigned.apk $subdomain.apk
                        # zipalign -v 4 $androidReleaseFolderPath/app-release.apk $subdomain.apk
                        # cd $subdomain
                        # keytool -storepass android123 -keypass android123 -genkey -alias $aliasname -keyalg RSA -keysize 2048 -keystore $keystore -dname "CN=Bitla Software, OU=Bitla, O=Bitla Software, L=Bangalore, ST=Karnataka, C=IN"
                        # keytool -importkeystore -srckeystore $keystore -destkeystore $keystore -deststoretype pkcs12
                        # cd $operatorDetailsPath
                    # ----------------------------------------------------------------------------------------------------------
                    
                    # ----------------------------------------------------------------------------------------------------------
                    # Move APK and Bundle to Subdomain Folder
                        mv $androidReleaseFolderPath/app-release.apk $subdomainFolder/$subdomain.apk
                        mv $androidReleaseBundleFolderPath/app-release.aab $subdomainFolder/$subdomain.aab
                    # ----------------------------------------------------------------------------------------------------------

                    # ----------------------------------------------------------------------------------------------------------
                    # Clear .jks / Keystore file and Operator Details from project/app and Todays folder 
                    
                        rm -rf $androidProjectPath/app/$keystore
                        rm -rf $operatorDetailsFolderPath
                    # ----------------------------------------------------------------------------------------------------------

                    # ----------------------------------------------------------------------------------------------------------
                    # Operator specific Splash Video change to low quality
                        if [ "$subdomain" == "cbsl" ]; then
                            mv $androidProjectPath/app/src/main/res/raw/splash_video_bkp.mp4 $androidProjectPath/app/src/main/res/raw/splash_video.mp4
                        fi
                    # ----------------------------------------------------------------------------------------------------------

                    # ----------------------------------------------------------------------------------------------------------
                    # Update Subdomain and build number
                        # endCurlUrl="https://script.google.com/macros/s/AKfycbznneUz0Qfj6-pJ6YJ0NtmrslwOGFhOtsGCusqVXBIcS--TUQvHPdo6QzOdFwgQz5sk/exec?is_json=true&is_post=true&empid=BS1614&user_agent=script&build_required=$buildRequired&subdomain=$subdomain"
                        endCurlUrl="https://script.google.com/macros/s/AKfycbxYfyiL-Ns_VK1t0K37dnt5ryTLM9a5fH4FlKdOnBo3rbCNpFu9iIifuRqVWXy_mIAhGQ/exec?build_number=$buildRequired&subdomain=$subdomain&is_from_script=true&update_entry=true"
                        # Send the request and capture the output
                        echo "Requesting URL: $endCurlUrl"
                        response=$(curl --location "$endCurlUrl")
                    # ----------------------------------------------------------------------------------------------------------

                else
                    echo -e "Operator subdomain not exists in directory.\n===========================================\n"
                fi

            # fi
        done
        
        rm -rf $androidProjectPath
    # *********************************************************************************************************


`;

const setup = `
#!/bin/bash

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Homebrew if not present
install_homebrew() {
    if ! command_exists brew; then
        echo -e "${YELLOW}Installing Homebrew...${NC}"
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        
        # Add Homebrew to PATH
        if [ -f /opt/homebrew/bin/brew ]; then
            eval "$(/opt/homebrew/bin/brew shellenv)"
        elif [ -f /usr/local/bin/brew ]; then
            eval "$(/usr/local/bin/brew shellenv)"
        fi
    fi
}

# Function to install and configure requirements
install_requirements() {
    echo -e "${YELLOW}===== Installing System Requirements =====${NC}"

    # Install Homebrew first
    install_homebrew

    # Update Homebrew
    brew update

    # Install GNU sed (gsed)
    if ! command_exists gsed; then
        echo -e "${YELLOW}Installing GNU sed...${NC}"
        brew install gnu-sed
        echo 'export PATH="/usr/local/opt/gnu-sed/libexec/gnubin:$PATH"' >> ~/.zshrc
    fi

    # Install ImageMagick
    if ! command_exists magick; then
        echo -e "${YELLOW}Installing ImageMagick...${NC}"
        brew install imagemagick
    fi

    # Install Java (OpenJDK 17)
    if ! command_exists java; then
        echo -e "${YELLOW}Installing OpenJDK 17...${NC}"
        brew install openjdk@17
        echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
        sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk
    fi

    # Install Android Platform Tools
    if ! command_exists adb; then
        echo -e "${YELLOW}Installing Android Platform Tools...${NC}"
        brew install --cask android-platform-tools
    fi

    # Install Gradle via SDKMAN
    if ! command_exists gradle; then
        echo -e "${YELLOW}Installing SDKMAN and Gradle...${NC}"
        curl -s "https://get.sdkman.io" | bash
        source "$HOME/.sdkman/bin/sdkman-init.sh"
        sdk install gradle 8.10
        sdk use gradle 8.10
    fi

    # Verify Android Home environment variable
    if [ -z "$ANDROID_HOME" ]; then
        echo -e "${YELLOW}Setting up Android Home environment variable...${NC}"
        echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
        echo 'export PATH=$PATH:$ANDROID_HOME/tools' >> ~/.zshrc
        echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.zshrc
    fi
}

# Verification Function
verify_requirements() {
    echo -e "${GREEN}===== Checking System Requirements =====${NC}"

    # Check Homebrew
    if command_exists brew; then
        echo -e "${GREEN}✓ Homebrew is installed${NC}"
    else
        echo -e "${RED}✗ Homebrew is NOT installed${NC}"
        return 1
    fi

    # Check GNU sed (gsed)
    if command_exists gsed; then
        echo -e "${GREEN}✓ GNU sed (gsed) is installed${NC}"
    else
        echo -e "${RED}✗ GNU sed (gsed) is NOT installed${NC}"
        return 1
    fi

    # Check ImageMagick
    if command_exists magick; then
        echo -e "${GREEN}✓ ImageMagick is installed${NC}"
    else
        echo -e "${RED}✗ ImageMagick is NOT installed${NC}"
        return 1
    fi

    # Check Java
    if command_exists java; then
        java_version=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}')
        echo -e "${GREEN}✓ Java is installed (Version: $java_version)${NC}"
    else
        echo -e "${RED}✗ Java is NOT installed${NC}"
        return 1
    fi

    # Check Android Platform Tools
    if command_exists adb; then
        echo -e "${GREEN}✓ Android Platform Tools are installed${NC}"
    else
        echo -e "${RED}✗ Android Platform Tools are NOT installed${NC}"
        return 1
    fi

    # Check Gradle
    if command_exists gradle; then
        gradle_version=$(gradle --version | awk '/^Gradle/ {print $2}')
        echo -e "${GREEN}✓ Gradle is installed (Version: $gradle_version)${NC}"
    else
        echo -e "${RED}✗ Gradle is NOT installed${NC}"
        return 1
    fi

    # Check Git
    if command_exists git; then
        git_version=$(git --version | awk '{print $3}')
        echo -e "${GREEN}✓ Git is installed (Version: $git_version)${NC}"
    else
        echo -e "${RED}✗ Git is NOT installed${NC}"
        return 1
    fi

    # Check Android Home environment variable
    if [ -n "$ANDROID_HOME" ]; then
        echo -e "${GREEN}✓ ANDROID_HOME is set (Path: $ANDROID_HOME)${NC}"
    else
        echo -e "${RED}✗ ANDROID_HOME is NOT set${NC}"
        return 1
    fi

    echo -e "${GREEN}===== All Requirements Verified Successfully =====${NC}"
    return 0
}

# Main execution
main() {
    # First, verify existing installations
    if verify_requirements; then
        echo -e "${GREEN}All requirements are already installed and configured.${NC}"
        exit 0
    fi

    # If verification fails, proceed with installation
    echo -e "${YELLOW}Some requirements are missing. Proceeding with installation...${NC}"
    install_requirements

    # Verify again after installation
    echo -e "\n${YELLOW}Verifying installations after setup...${NC}"
    verify_requirements
}

# Run the main function
main
`;