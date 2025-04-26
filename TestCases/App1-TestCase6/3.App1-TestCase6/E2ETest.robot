*** Settings ***
Library           SeleniumLibrary

*** Test Cases ***
Test Case 6: Contact Us Form
    Open Browser    http://automationexercise.com    chrome
    Maximize Browser Window
    Wait Until Element Is Visible    //a[@href='/']
    Click Element    //a[@href='/']
    Wait Until Element Is Visible    //h1/span[text()='Automation']
    Wait Until Element Is Visible    //h2[text()='Full-Fledged practice website for Automation Engineers']
    Wait Until Element Is Visible    //p[contains(text(), 'All QA engineers can use this website')]
    Wait Until Element Is Visible    //a[@class='test_cases_list']/button[text()='Test Cases']
    Wait Until Element Is Visible    //a[@class='apis_list']/button[text()='APIs list for practice']
    Wait Until Element Is Visible    //img[@class='girl img-responsive' and @alt='demo website for practice']
    # Click Element    //a[contains(text(), ' Contact us')]
    Click Element    //a[@href='/contact_us']
    # Go To    https://automationexercise.com/contact_us
    Wait Until Element Is Visible    //h2[contains(text(), 'Get In Touch')]
    Input Text    //*[@id='contact-us-form']//input[@name='name']    Your Name
    Input Text    //*[@id='contact-us-form']//input[@name='email']    your.email@example.com
    Input Text    //*[@id='contact-us-form']//input[@name='subject']    Subject Here
    Input Text    //*[@id='contact-us-form']//textarea[@name='message']    Your message here.
    Choose File    //*[@id='contact-us-form']//input[@name='upload_file']    C:\\Users\\Elvis\\OneDrive\\Imagens\\133714229538608439.jpg
    Click Element    //*[@id='contact-us-form']//input[@name='submit']
    # Wait Until Element Is Visible    //button[contains(text(), 'OK')]
    # Click Element    //button[contains(text(), 'OK')]
    Handle Alert    action=ACCEPT   #adicionado
    Wait Until Element Is Visible    //div[contains(text(), 'Success! Your details have been submitted successfully.')]
    Click Element    //a[contains(@href, '/') and contains(text(), 'Home')]
    Close Browser