urls = ["http://automationexercise.com","https://automationexercise.com/login"]

Test Case 3: Login User with incorrect email and password
1. Launch browser
2. Navigate to url 'http://automationexercise.com'
3. Verify that home page is visible successfully
4. Click on 'Signup / Login' button
5. Verify 'Login to your account' is visible
6. Enter incorrect email address and password
7. Click 'login' button
8. Verify error 'Your email or password is incorrect!' is visible

urls = ["http://automationexercise.com","https://automationexercise.com/login"]

Test Case 3: Login User with incorrect email and password
1. Launch browser
2. Navigate to url 'http://automationexercise.com'
3. Click on 'Signup / Login' button
4. Enter incorrect email address and password
5. Click 'login' button
6. Verify error 'Your email or password is incorrect!' is visible


{
  "testCase": "Login User with incorrect email and password",
  "modules": [
    {
      "url": "http://automationexercise.com",
      "purpose": "Home page of the application",
      "execution_steps": [
        {
          "step": "Launch browser",
          "extracted_data": []
        },
        {
          "step": "Navigate to url 'http://automationexercise.com'",
          "extracted_data": []
        },
        {
          "step": "Click on 'Signup / Login' button",
          "extracted_data": []
        }
      ]
    },
    {
      "url": "https://automationexercise.com/login",
      "purpose": "Login page for users to enter their credentials",
      "execution_steps": [
        {
          "step": "Enter incorrect email address and password",
          "extracted_data": []
        },
        {
          "step": "Click 'login' button",
          "extracted_data": []
        },
        {
          "step": "Verify error 'Your email or password is incorrect!' is visible",
          "extracted_data": []
        }
      ]
    }
  ]
}

{
  "testCase": "Login User with incorrect email and password",
  "modules": [
    {
      "url": "http://automationexercise.com",
      "purpose": "Home page of the application",
      "execution_steps": [
        {
          "step": "Launch browser",
          "extracted_data": []
        },
        {
          "step": "Navigate to url 'http://automationexercise.com'",
          "extracted_data": []
        },
        {
          "step": "Verify that home page is visible successfully",
          "extracted_data": []
        },
        {
          "step": "Click on 'Signup / Login' button",
          "extracted_data": [
            {
              "type": "button",
              "request_description": "Button to navigate to the Signup / Login page",
              "identifier_type": "XPath",
              "identifier_tracking": "//a[contains(text(), 'Signup / Login')]"
            },
            {
              "type": "button",
              "request_description": "Button to navigate to the Signup / Login page",
              "identifier_type": "XPath",
              "identifier_tracking": "//*[@id='header']/div[2]/div/div/div[2]/div[1]/ul/li[1]/a"
            }
          ]
        }
      ],
      "token": {
        "completion_tokens": 190,
        "prompt_tokens": 20854,
        "total_tokens": 21044,
        "completion_tokens_details": null,
        "prompt_tokens_details": null
      },
      "dispatcher": {
        "memory_usage_MB": 0.15625,
        "peak_memory_MB": 0.15625,
        "start_time": "2025-04-20T15:17:32.068558",
        "end_time": "2025-04-20T15:17:35.809401",
        "duration_seconds": 3.740843
      }
    },
    {
      "url": "https://automationexercise.com/login",
      "purpose": "Login page for users to enter their credentials",
      "execution_steps": [
        {
          "step": "Verify 'Login to your account' is visible",
          "extracted_data": [
            {
              "type": "h2",
              "request_description": "'Login to your account' header",
              "identifier_type": "XPath",
              "identifier_tracking": "//h2[text()='Login to your account']"
            }
          ]
        },
        {
          "step": "Enter incorrect email address and password",
          "extracted_data": [
            {
              "type": "input",
              "request_description": "Field to enter the user's email address",
              "identifier_type": "XPath",
              "identifier_tracking": "//*[@id='form']//input[@name='email']"
            },
            {
              "type": "input",
              "request_description": "Field to enter the user's password",
              "identifier_type": "XPath",
              "identifier_tracking": "//*[@id='form']//input[@name='password']"
            }
          ]
        },
        {
          "step": "Click 'login' button",
          "extracted_data": [
            {
              "type": "button",
              "request_description": "Button to submit the login form",
              "identifier_type": "XPath",
              "identifier_tracking": "//*[@id='form']//button[@type='submit']"
            }
          ]
        },
        {
          "step": "Verify error 'Your email or password is incorrect!' is visible",
          "extracted_data": [
            {
              "type": "div",
              "request_description": "Error message for incorrect email or password",
              "identifier_type": "XPath",
              "identifier_tracking": "//div[contains(text(), 'Your email or password is incorrect!')]"
            }
          ]
        }
      ],
      "token": {
        "completion_tokens": 347,
        "prompt_tokens": 5589,
        "total_tokens": 5936,
        "completion_tokens_details": null,
        "prompt_tokens_details": null
      },
      "dispatcher": {
        "memory_usage_MB": 0.0,
        "peak_memory_MB": 0.0,
        "start_time": "2025-04-20T15:17:41.363234",
        "end_time": "2025-04-20T15:17:46.710320",
        "duration_seconds": 5.347086
      }
    }
  ]
}
