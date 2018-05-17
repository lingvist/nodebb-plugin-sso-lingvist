# NodeBB Lingvist SSO

Plugin for [NodeBB](https://nodebb.org/) forum to allow [Lingvist](https://lingvist.com/) users to log in the [Lingvist forum](https://lingvist.com/forum) with their [Lingvist](https://lingvist.com/) credentials.

1. Include into your NodeBB's `package.json` as dependency
1. Install NodeBB
1. Activate `nodebb-plugin-sso-lingvist` via admin UI
1. Restart forum
1. Fill in Lingvist OAuth2 form from Admin -> Social Authentication -> lingvist
    1. OAuth ID - your OAuth client id pre-agreed with Lingvist OAuth provider
    1. OAuth Password - your OAuth client password pre-agreed with Lingvist OAuth provider
    1. Authorization URL - https://learn.lingvist.com/#sso
    1. Token URL - https://api.lingvist.com/oauth2/token
    1. Profile URL - https://api.lingvist.com/1.0/user/profile
1. Restart forum
1. Login/SignUp via Alternative Logins
