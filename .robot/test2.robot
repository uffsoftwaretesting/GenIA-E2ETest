To create an E2E test script using the Robot Framework, you need to use the SeleniumLibrary, which provides keywords for interacting with web browsers via the Selenium WebDriver. Below is a Robot Framework test script that follows your requirements:

```robot
*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${SIGNUP_URL}          http://localhost:5173/SignUp
${SUCCESS_MESSAGE}     Cadastro realizado com sucesso!
${ERROR_NAME}          Nome deve ter entre 2 e 50 caracteres.
${ERROR_SURNAME}       Sobrenome deve ter entre 2 e 50 caracteres.
${ERROR_EMAIL_MATCH}   Os e-mails não coincidem.
${ERROR_PASSWORD}      A senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma letra minúscula e um número.
${ERROR_TERMS}         Você deve aceitar os termos de uso.

*** Test Cases ***
Sign-Up With Valid Data
    Open Browser    ${SIGNUP_URL}    Chrome
    Input Text    xpath:/html/body/div[@id='root']/div/div[2]/div/form/input[@id='input_nome']    Maria
    Input Text    xpath:/html/body/div[@id='root']/div/div[2]/div/form/input[2]    Silva
    Input Text    xpath:/html/body/div[@id='root']/div/div[2]/div/form/input[@id='input_email']    maria@example.com
    Input Text    xpath:/html/body/div[@id='root']/div/div[2]/div/form/input[@id='input_confirmar_email']    maria@example.com
    Input Text    xpath:/html/body/div[@id='root']/div/div[2]/div/form/input[@id='input_senha']    Senha123
    Input Text    xpath:/html/body/div[@id='root']/div/div[2]/div/form/input[@id='input_confirmar_senha']    Senha123
    Click Element    xpath:/html/body/div[@id='root']/div/div[2]/div/form/button[@id='submit_form']
    Wait Until Element Is Visible    xpath://*[contains(text(), '${SUCCESS_MESSAGE}')]
    Page Should Contain    ${SUCCESS_MESSAGE}
    [Teardown]    Close Browser

Sign-Up With Invalid Name
    Open Browser    ${SIGNUP_URL}    Chrome
    Input Text    xpath:/html/body/div[@id='root']/div/div[2]/div/form/input[@id='input_nome']    M
    Input Text    xpath:/html/body/div[@id='root']/div/div[2]/div/form/input[2]    Silva
    # Fill in other fields with valid data...
    Click Element    xpath:/html/body/div[@id='root']/div/div[2]/div/form/button[@id='submit_form']
    Wait Until Element Is Visible    xpath://*[contains(text(), '${ERROR_NAME}')]
    Page Should Contain    ${ERROR_NAME}
    [Teardown]    Close Browser

Sign-Up With Email Mismatch
    Open Browser    ${SIGNUP_URL}    Chrome
    Input Text    xpath:/html/body/div[@id='root']/div/div[2]/div/form/input[@id='input_email']    usuario@example.com
    Input Text    xpath:/html/body/div[@id='root']/div/div[2]/div/form/input[@id='input_confirmar_email']    usuario@diferente.com
    # Fill in other fields with valid data...
    Click Element    xpath:/html/body/div[@id='root']/div/div[2]/div/form/button[@id='submit_form']
    Wait Until Element Is Visible    xpath://*[contains(text(), '${ERROR_EMAIL_MATCH}')]
    Page Should Contain    ${ERROR_EMAIL_MATCH}
    [Teardown]    Close Browser

Sign-Up With Invalid Password
    Open Browser    ${SIGNUP_URL}    Chrome
    Input Text    xpath:/html/body/div[@id='root']/div/div[2]/div/form/input[@id='input_senha']    senha123
    Input Text    xpath:/html/body/div[@id='root']/div/div[2]/div/form/input[@id='input_confirmar_senha']    senha123
    # Fill in other fields with valid data...
    Click Element    xpath:/html/body/div[@id='root']/div/div[2]/div/form/button[@id='submit_form']
    Wait Until Element Is Visible    xpath://*[contains(text(), '${ERROR_PASSWORD}')]
    Page Should Contain    ${ERROR_PASSWORD}
    [Teardown]    Close Browser

Sign-Up Without Accepting Terms
    Open Browser    ${SIGNUP_URL}    Chrome
    Input Text    xpath:/html/body/div[@id='root']/div/div[2]/div/form/input[@id='input_nome']    Maria
    Input Text    xpath:/html/body/div[@id='root']/div/div[2]/div/form/input[2]    Silva
    # Ensure to leave the Terms checkbox unchecked...
    Input Text    xpath:/html/body/div[@id='root']/div/div[2]/div/form/input[@id='input_senha']    Senha123
    Input Text    xpath:/html/body/div[@id='root']/div/div[2]/div/form/input[@id='input_confirmar_senha']    Senha123
    Click Element    xpath:/html/body/div[@id='root']/div/div[2]/div/form/button[@id='submit_form']
    Wait Until Element Is Visible    xpath://*[contains(text(), '${ERROR_TERMS}')]
    Page Should Contain    ${ERROR_TERMS}
    [Teardown]    Close Browser

# ```

# ### Explanation:
# - **Open Browser**: Initializes the browser and navigates to the Sign-Up page using the URL provided.
# - **Input Text**: Fills in form fields using XPath to locate elements, as specified in the JSON objects.
# - **Click Element**: Simulates clicking the "Cadastrar" button.
# - **Wait Until Element Is Visible** and **Page Should Contain**: These commands ensure that the success message or error messages appear as expected.
# - **[Teardown]**: This keyword closes the browser at the end of each test case, ensuring a clean state for subsequent tests.

# Make sure you have installed the necessary libraries (`SeleniumLibrary`) and have a WebDriver (e.g., ChromeDriver) available in your PATH to execute these tests. Adjust the setup if your URL or identifiers change.