// TODO : http://stackoverflow.com/questions/38240504/refresh-expired-jwt-in-browser-when-using-google-sign-in-for-websites
// OR   : http://stackoverflow.com/questions/32150845/how-to-refresh-expired-google-sign-in-logins?rq=1
// READ : http://stackoverflow.com/questions/3105296/if-rest-applications-are-supposed-to-be-stateless-how-do-you-manage-sessions
// READ : http://www.cloudidentity.com/blog/2014/03/03/principles-of-token-validation/
// TODO : https://jsfiddle.net/JamesWClark/8p8subj9/
// CLIENT API: https://developers.google.com/identity/sign-in/web/reference#gapiauth2authresponse

var profile; // google user profile
var authResponse; // google user auth response

function start() {
    gapi.load('auth2', function() {
        auth2 = gapi.auth2.init({
            client_id : '1004553692658-5t5f2fmnmgqtokt2hre4h0c4lshvohlg.apps.googleusercontent.com',
            // Scopes to request in addition to 'profile' and 'email'
            //scope: 'additional_scope'
        })
        
        // pending testing: https://stackoverflow.com/a/37580494/1161948
        // Listen for changes to current user.
        // (called shortly before expiration)
        auth2.currentUser.listen(function(googleUser){            
            authResponse = googleUser.getAuthResponse();
            profile = googleUser.getBasicProfile();

            if(Object.keys(authResponse).length > 0) {
                console.log(moment().format() + ': listener has fired an event');
                console.log('time to compare tokens');
                console.log(JSON.stringify(parseJwt(authResponse.id_token)));
            }
        });

        auth2.isSignedIn.listen(signinChanged);

        auth2.currentUser.listen(userChanged);

        // custom button
        auth2.attachClickHandler(document.getElementById('g-signin'), {}, function(googleUser) {
            onSignIn(googleUser);
        }, function(error) {
            console.log(JSON.stringify(error, undefined, 2));
        })
    })
}

function toggleLoginButton(isSignedIn) {
    if(isSignedIn) {
        $('#g-signin').hide();
        $('#g-signout').show();
    } else {
        $('#g-signin').show();
        $('#g-signout').hide();
    }
}

function signinChanged(state) {
    console.log('signin state changed to ', state);
    toggleLoginButton(state);
}

function userChanged(user) {
    console.log('user now: ', user);
}

function onSignIn(googleUser) {
    
    // pass a true parameter = include access_token, see: https://stackoverflow.com/a/44773920/1161948
    // authResponse = googleUser.getAuthResponse(true); 
    authResponse = googleUser.getAuthResponse(); 
    profile = googleUser.getBasicProfile();
    
    console.log('googleUser = ', googleUser);
    console.log('profile = ', profile);
    console.log('authResponse = ', authResponse);

    writeCookie('idtoken', authResponse.id_token);

    var login = {
        id: profile.getId(),
        accessToken: authResponse.access_token,
        name: profile.getName(),
        givenName: profile.getGivenName(),
        familyName: profile.getFamilyName(),
        imageUrl: profile.getImageUrl(),
        email: profile.getEmail(),
        hostedDomain: googleUser.getHostedDomain()
    };
    
    toggleLoginButton(true)
}

function signOut() {
    gapi.auth2.getAuthInstance().signOut().then(function() {
        toggleLoginButton(false);
    });
}

function disconnect() {
    gapi.auth2.getAuthInstance().disconnect().then(function() {
        toggleLoginButton(false);
    });
}

// bakes cookies
function writeCookie(key, value) {
    // expire in six months
    var exp = moment().add(6, 'month').utc().toString();
    document.cookie = key + '=' + value + ';expires=' + exp + ';path=/';
}

// reads cookies
// https://stackoverflow.com/a/5639455/1161948
(function(){
    var cookies;

    function readCookie(name,c,C,i){
        if(cookies){ return cookies[name]; }

        c = document.cookie.split('; ');
        cookies = {};

        for(i=c.length-1; i>=0; i--){
           C = c[i].split('=');
           cookies[C[0]] = C[1];
        }

        return cookies[name];
    }

    window.readCookie = readCookie; // or expose it however you want
})();

// https://stackoverflow.com/a/38552302/1161948
function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace('-', '+').replace('_', '/');
    return JSON.parse(atob(base64));
};

console.log('cookie = ' + readCookie('idtoken'));
