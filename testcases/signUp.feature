Feature: New User Registration  
  As a new user,  
  I want to register by filling out a form with validated fields,  
  So that my registration is secure and accurate.  

  Scenario: Successful registration with valid fields  
    Given I am on the registration page  
    When I enter "Maria" in the "First Name" field  
    And I enter "Silva" in the "Last Name" field  
    And I enter "maria@example.com" in the "Email" field  
    And I confirm my email with "maria@example.com"  
    And I enter "Password123" in the "Password" field  
    And I confirm my password with "Password123"  
    And I accept the Terms of Use  
    And I click the "Register" button  
    Then I should see the success message "Registration completed successfully!" to confirming my registration  

Feature: Página de Cadastro de Novo Usuário
  Como novo usuário,
  Eu quero preencher um formulário de cadastro com campos bem validados,
  Para que meu cadastro seja seguro e preciso.

  Scenario: Cadastro com todos os campos válidos
    Given que eu estou na página de cadastro
    When eu preencho o campo "Nome" com "Maria"
    And eu preencho o campo "Sobrenome" com "Silva"
    And eu preencho o campo "E-mail" com "maria@example.com"
    And eu preencho o campo "Confirmar E-mail" com "maria@example.com"
    And eu preencho o campo "Senha" com "Senha123"
    And eu preencho o campo "Confirmar Senha" com "Senha123"
    And eu marco o checkbox "Aceitar Termos de Uso"
    And eu clico no botão "Cadastrar"
    Then eu devo ver a mensagem "Cadastro realizado com sucesso!"

  Scenario: Nome inválido
    Given que eu estou na página de cadastro
    When eu preencho o campo "Nome" com "M"
    And eu preencho os demais campos corretamente
    And eu clico no botão "Cadastrar"
    Then eu devo ver a mensagem de erro "Nome deve ter entre 2 e 50 caracteres."

  Scenario: Sobrenome inválido
    Given que eu estou na página de cadastro
    When eu preencho o campo "Sobrenome" com "S"
    And eu preencho os demais campos corretamente
    And eu clico no botão "Cadastrar"
    Then eu devo ver a mensagem de erro "Sobrenome deve ter entre 2 e 50 caracteres."

  Scenario: E-mail e confirmação de e-mail não coincidem
    Given que eu estou na página de cadastro
    When eu preencho o campo "E-mail" com "usuario@example.com"
    And eu preencho o campo "Confirmar E-mail" com "usuario@diferente.com"
    And eu preencho os demais campos corretamente
    And eu clico no botão "Cadastrar"
    Then eu devo ver a mensagem de erro "Os e-mails não coincidem."

  Scenario: Senha não atende aos critérios mínimos
    Given que eu estou na página de cadastro
    When eu preencho o campo "Senha" com "senha123"
    And eu preencho o campo "Confirmar Senha" com "senha123"
    And eu preencho os demais campos corretamente
    And eu clico no botão "Cadastrar"
    Then eu devo ver a mensagem de erro "A senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma letra minúscula e um número."

  Scenario: Checkbox de Termos de Uso não marcado
    Given que eu estou na página de cadastro
    When eu preencho todos os campos corretamente
    And eu deixo o checkbox "Aceitar Termos de Uso" desmarcado
    And eu clico no botão "Cadastrar"
    Then eu devo ver a mensagem de erro "Você deve aceitar os termos de uso."