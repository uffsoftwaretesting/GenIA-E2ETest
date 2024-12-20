Certainly! Based on your requirements and the provided HTML, here's a Robot Framework script for the scenario "Cadastro com todos os campos válidos". This script uses Selenium to automate the test:

```robot framework
*** Settings ***
Library    SeleniumLibrary
Library    Collections

*** Variables ***
${URL}     http://localhost:5173
${VALID_NAME}      Maria
${VALID_SURNAME}   Silva
${VALID_EMAIL}     maria@example.com
${VALID_PASSWORD}  Senha123
${SUCCESS_MESSAGE}  Cadastro realizado com sucesso!

*** Test Cases ***
Cadastro Com Todos Os Campos Válidos
    [Documentation]    Teste de cadastro com todos os campos válidos.
    Open Browser   ${URL}/SignUp   Chrome
    Maximize Browser Window
    Preencher Cadastro Válido
    Clicar Botao Cadastrar
    Verificar Mensagem Sucesso
    [Teardown]   Close Browser

*** Keywords ***
Preencher Cadastro Válido
    [Documentation]    Preenche o formulário de cadastro com dados válidos.
    Input Text   xpath=//*[@id='input_nome']      ${VALID_NAME}
    Input Text   xpath=//*[@id='input_sobrenome'] ${VALID_SURNAME}
    Input Text   xpath=//*[@id='input_email']     ${VALID_EMAIL}
    Input Text   xpath=//*[@id='input_confirmar_email']  ${VALID_EMAIL}
    Input Password   xpath=//*[@id='input_senha']  ${VALID_PASSWORD}
    Input Password   xpath=//*[@id='input_confirmar_senha']  ${VALID_PASSWORD}
    Click Element   xpath=//input[@type='checkbox']

Clicar Botao Cadastrar
    [Documentation]    Clica no botão de cadastro.
    Click Button    xpath=//*[@id='submit_form']

Verificar Mensagem Sucesso
    [Documentation]    Verifica se a mensagem de sucesso é exibida.
    Wait Until Page Contains   ${SUCCESS_MESSAGE}   timeout=10s
```

#### Explanation:
- **Open Browser**: This keyword opens the specified URL in a Chrome browser.
- **Preencher Cadastro Válido**: Fills out the registration form with valid data.
- **Clicar Botao Cadastrar**: Simulates clicking the "Register" button.
- **Verificar Mensagem Sucesso**: Waits to ensure that the success message appears on the page after submission.

This script is specifically for the "Cadastro com todos os campos válidos" scenario. For other scenarios such as invalid name or mismatched emails, you would modify the input data accordingly and check for the respective error messages. You can expand the test suite by adding additional test cases and utilizing the similar structure of the keywords.