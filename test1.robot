Certainly! Based on your requirements and the provided HTML, here's a Robot Framework script for the scenario "Cadastro com todos os campos válidos". This script uses Selenium to automate the test:

```robot framework
*** Settings ***
Library    SeleniumLibrary
Library    Collections
*** Variables ***
${URL}                                  http://localhost:5173/SignUp
${VALID_NAME}                           Maria
${VALID_SURNAME}                        Silva
${VALID_EMAIL}                          maria@example.com
${VALID_PASSWORD}                       Password123
${INPUT_FIRST_NAME_XPATH}               //*[@id='input_nome']   
${INPUT_LAST_NAME_XPATH}                //*[@id='input_sobrenome'] 
${INPUT_EMAIL_XPATH}                    //*[@id='input_email']  
${INPUT_EMAIL_CONFIRMATION_XPATH}       //*[@id='input_confirmar_email']  
${INPUT_PASSWORD_XPATH}                 //*[@id='input_senha']     
${INPUT_PASSWORD_CONFIRMATION_XPATH}    //*[@id='input_confirmar_senha']   
${CHECKBOX_XPATH}                       //input[@type='checkbox']   
${SUCCESS_MESSAGE}                      Registration completed successfully!
${REGISTER_BUTTON_XPATH}                //*[@id='submit_form']

*** Test Cases ***
Register With All Valid Fields
    [Documentation]                     Registration test with all valid fields.
    Open Browser                        ${URL}                              Chrome
    Maximize Browser Window
    Fill Valid Registration Form
    Click Register Button
    Verify Success Message
    [Teardown]   Close Browser

*** Keywords ***
Fill Valid Registration Form
    [Documentation]      Fills the registration form with valid data.
    Input Text           xpath=${INPUT_FIRST_NAME_XPATH}               ${VALID_NAME}
    Input Text           xpath=${INPUT_LAST_NAME_XPATH}                ${VALID_SURNAME}
    Input Text           xpath=${INPUT_EMAIL_XPATH}                    ${VALID_EMAIL}
    Input Text           xpath=${INPUT_EMAIL_CONFIRMATION_XPATH}       ${VALID_EMAIL}
    Input Password       xpath=${INPUT_PASSWORD_XPATH}                 ${VALID_PASSWORD}
    Input Password       xpath=${INPUT_PASSWORD_CONFIRMATION_XPATH}    ${VALID_PASSWORD}
    Click Element        xpath=${CHECKBOX_XPATH}

Click Register Button
    [Documentation]    Clicks the register button.
    Click Button         xpath=${REGISTER_BUTTON_XPATH}

Verify Success Message
    [Documentation]    Verifies if the success message is displayed.
    Wait Until Page Contains     ${SUCCESS_MESSAGE}   timeout=10s



# ```S

#### Explanation:
# - **Open Browser**: This keyword opens the specified URL in a Chrome browser.
# - **Preencher Cadastro Válido**: Fills out the registration form with valid data.
# - **Clicar Botao Cadastrar**: Simulates clicking the "Register" button.
# - **Verificar Mensagem Sucesso**: Waits to ensure that the success message appears on the page after submission.

# This script is specifically for the "Cadastro com todos os campos válidos" scenario. For other scenarios such as invalid name or mismatched emails, you would modify the input data accordingly and check for the respective error messages. You can expand the test suite by adding additional test cases and utilizing the similar structure of the keywords.