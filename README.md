# Boekhoud Source - Bizcuit Link API

Retrieve bank transactions from Bizcuit in Boekhoud Source.

The following endpoints are available:

## /bizcuit_auth

A request to retrieve bank transactions from Bizcuit is initiated by requesting an authorization url and a request id.

The url refers to the Bizcuit OpenID login page where
the user is asked to authenticate himself and for permission to reveal his email address
and bank account transactions.

The request id, together with a pincode, is used by Boekhoud Source to retrieve the bank transactions from Bizcuit.

## /bizcuit_auth_response

When a user has succesfully authenticated himself and has approved the requested permissions
the Bizcuit server will send the response to this address.

The API will then generate a secure pincode and send this pincode to the email address of the Bizcuit user.

## /bizcuit_transactions

Using the request id and the pincode that is received at the Bizcuit user's email address
the bank transactions can be retrieved.

# Main considerations

- The API has a minimal number of endpoints
- No data is stored in the API
- Consent is asked explicitly, each time a user requests for his bank transactions (transparancy)
- Bank transactions are streamed in CAMT format
- API error messages are as short as possible and do not reveal details
- All handling is done within the lifetime of a single access token
- Pending requests are automatically removed after 60 seconds
- Requests are automatically removed on the first call to get the bank transactions (successfull or not)

# Hosting and documentation

Hosting
- [Heroku](https://bclink.herokuapp.com/)

API documentation
- [Swagger documentation](https://bclink.herokuapp.com/api-docs/)

Bizcuit API documentation
- [Bizcuit API](https://www.bizcuit.nl/api-documentatie/)

## Configuration

An example configuration file is available in .env.example

Any missing configuration parameters will prohibit the API from starting 

## Scripts

`yarn`

Initialize the project

`yarn dev`

Run the BSlink API in development mode.

Run `http://localhost:8080/` to view the output in your browser.

`yarn build`

Build the API for production usage

`yarn start`

Serve the production API
