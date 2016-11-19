$(document).ready(function() {
    /**
     * Generates a string of random numbers and letters
     * @param  {int} length [length of desired string]
     * @return {string}        [string of random letters and numbers]
     */
    function generateRandomString(length) {
		var text = '';
		var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

		for (var i = 0; i < length; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}

		return text;
	};
	
	/**
	 * Handles OAuth params and redirects user to authorization page
	 * @return {none} window redirect
	 */
	function spotifyLogin() {

	    var client_id = '73a053a3263e4777a1424219269f36ce',
	    	redirect_uri = 'http://127.0.0.1:8887/index.html',
	    	scopes = 'user-read-email playlist-read-private playlist-read-collaborative',
	    	state = generateRandomString(16);

	    var auth_params = {
	    	'client_id': client_id,
	    	'response_type': 'token',
	    	'redirect_uri': redirect_uri,
	    	'scope': scopes,
	    	'state': state,
	    	'show_dialog': 'true' 	// I added this for testing purposes so we always have to approve auth
	    }

	    var auth_url = 'https://accounts.spotify.com/authorize?' + $.param(auth_params);

	    //	The 'state' parameter allows us to verify that it's actually Spotify
	    //	redirecting to our site. We store this in localStorage for now because the
	    //	window location is about to be changed to spotify's authorization request page.
	    localStorage.setItem(stateKey, state);

	    window.location = auth_url;
	}
	
	function requestUserData(token) {
		$.ajax({
			url: 'https://api.spotify.com/v1/me/',
			headers: {
				'Authorization': 'Bearer ' + token
			},
			success: function(response) {
				
				userData.setUserData(response);
				insertUserData(userData);
				
				console.log("user response");
				console.log(response);
			}
		});
	}
	
	function requestPlaylistsData(token) {
		$.ajax({
			url: 'https://api.spotify.com/v1/me/playlists?limit=50',
			headers: {
				'Authorization': 'Bearer ' + token
			},
			success: function(response) {
				
				playlistsData.total = response.total;
				playlistsData.addToPlaylists(response);
				
				if (response.next !== null) {
					
					requestNextPlaylistsData(token, response.next);
					
				} else {
					
					insertPlaylists(playlistsData);
				}
				
				console.log("playlists response");
				console.log(response);
			}
		});
	}
	
	//function to request the next page of Playlists
	//as playlists query only returns a max 50 per request
	function requestNextPlaylistsData(token, nextQuery) {
		$.ajax({
			url: nextQuery,
			headers: {
				'Authorization': 'Bearer ' + token
			},
			success: function(response) {
				
				playlistsData.addToPlaylists(response);
				
				//using a little recursion here until
				//all pages have been added to our array
				if (response.next !== null) {
					
					requestNextPlaylistsData(token, response.next);
					
				} else {
					
					insertPlaylists(playlistsData);
				}
				
				console.log("next response");
				console.log(response);
			}
		});
	}


	function insertUserData(user) {
		$('#userImg').attr('src', user.image);
		$('#userName').html(user.id);
		$('#userEmail').html(user.email);
	}

	function insertPlaylists(playlistData) {
		console.log("am i working");
		if (playlistData.total > PAGE_LIMIT) {

			totalPages = Math.ceil(playlistData.total / 20);
			showPagination();

		} else {
			totalPages = 1;
		}
		
		for (var i = 0; i < playlistData.playlists.length; i++) {
			playlistTemplate(playlistData.playlists[i]);
		}
		
		console.log("adding playlists");
	}

	function playlistTemplate(playlistData) {
		
		let name = playlistData.playlistName;
		let trackTotal = playlistData.numOfTracks;
		let link = playlistData.tracksLink;
		let img = playlistData.playlistImg;
		
		
		
		let template = $('<li>', {
			'id': 'playlist-' + name.replace(/\s/g, '_'),
			'class': 'collection-item avatar grey darken-4',
			'data-tracks': link,
			'data-total': trackTotal,
			'data-img': img
		}).html(
			`<img src="${img}" alt="playlist art">`
			+`<span class="title">${name}</span>`
			+`<p>Tracks: ${trackTotal}</p>`
			+`<a href="#!" class="secondary-content">`
			+`<i class="material-icons grey lighten-5">music video</i></a></div>`
		)

		$(template).on('click', function() {
			playlistClicked($(this));
		});

		console.log(template);

		$('.collection').append(template);
	}
		
	function showPagination() {
			
		for (var i = 1; i <= totalPages; i++) {
			let template =
				
				`<li class="wave-effect" value="${i}"><a href="#!">${i}</a></li>`;
			
			$('#numbers-area').append(template);
		}
		
		$('.pagination').show();
	}


	///////////////////////////////////////////
	// FUNCTION DECLARATIONS ABOVE THIS LINE //
	///////////////////////////////////////////
	var userData = {
		//placeholder default data
		id: "Team SpotiTube",
		email: "mail@SpotiTube.com",
		image: "assets/images/defaultuser.jpg",
		
		setUserData: function(response) {
			
			this.id = response.id;
			this.email = response.email;
			//see if user has an profile pic
			if(response.images.length !== 0){
			
				this.image = response.images[0].url;
				
			}
		}
	};
	
	var playlistsData = {
		playlists: [],
		total: 0, //total count of users playlists
		
		addToPlaylists: function(response) {
			
			let plData = response.items;
			
			for (var i = 0; i < plData.length; i++) {
				
				//using push instead of index to add to playlists
				//if this is a next page request
				this.playlists.push(
					new Playlist(plData[i].name, plData[i].tracks.total, plData[i].images, plData[i].href) 
				);
				
			}
			
			console.log(playlistsData.playlists);
		}
	};
	
	//protype function for creating playlist objects
	function Playlist(playlistName, numOfTracks, playlistImgs, tracksLink) {
		this.playlistName = playlistName;
		this.numOfTracks = numOfTracks;
		this.tracksLink = tracksLink;
		this.playlistImg;
		if(playlistImgs.length !== 0){
		
			this.playlistImg = playlistImgs[0].url;
			
		} else {
			//using the first index as images are held in an array
			//of multipe resolutions this helps prevent confusion in later use
			this.playlistImg = "http://placehold.it/64x64";
		}
	}






	/////////////////////////////////////////
	// OBJECT DECLARATIONS ABOVE THIS LINE //
	/////////////////////////////////////////

	/*
		We will need this var to store/retrieve state value in localstorage either way
		so rather than create two separate vars, we just make this one global.
	 */
	var stateKey = 'spotify_auth_state';

	const PAGE_LIMIT = 20;
	var totalPages;
	var list = [];


	//////////////////////////////////////
	// GLOBAL VARIABLES ABOVE THIS LINE //
	//////////////////////////////////////


	///////////////////////////////
	// ALL LOGIC BELOW THIS LINE //
	///////////////////////////////

    $(".button-collapse").sideNav();
	
	$(".pagination").hide();

    if (/index\.html$/.test(location.href)) {

	    $('.modal').modal({
	        dismissible: false
	    });

	    $('#modal1').modal('open');
	    
	    $('.login-button').on('click', function() {

	    	spotifyLogin();
	    	
	    });
	}
	else if (location.hash) {

		// Here we're using a short regular expression to replace the # in location.hash
		// then we're using a series of split() functions to get and store the key/value
		// pairs returned from spotify. 
		var hash = location.hash.replace(/#/g, '');
		var all = hash.split('&');
		var args = {};

		all.forEach(function(keyvalue) {
			var key = keyvalue.split('=')[0],
				value = keyvalue.split('=')[1];
			args[key] = value;
		});

		//	If you want to see what spotify returns, you can take a look at their docs..
		//	... or look at your console.
		console.log(args);

		//	Here we're grabbing the access token and returned state from spotify,
		//	as well as retrieving our sent state value from localStorage.
		var access_token = args.access_token,
			state = args.state,
			storedState = localStorage.getItem(stateKey);

		// Here we're making sure everything is authentic (pun intended).
		// If the redirected url doesn't contain a state parameter or if it doesn't
		// match our storedState value, we don't want to continue because something
		// went wrong somewhere (or someone is likely trying to hack us).
		if (access_token && (state == null || state != storedState)) {

			alert('There was an error during the authentication');

		}
		//	If everything checks out, then we continue
		else {

			// removing our stored state value from localStorage because we won't 
			// use it again. If we need to re-authenticate it will generate a new state.
			localStorage.removeItem(stateKey);

			// Obviously we only want to make our requests to spotify's api if we
			// received our access token. If it doesn't exist, we should probably add
			// some error message and handling to an else statement (TODO)
			if (access_token) {
				
				console.log("token granted!");
				requestUserData(access_token);
				requestPlaylistsData(access_token);
			}
		}
	}
	else {

		$('.modal').modal({
	        dismissible: false
	    });

	    $('#modal2').modal('open');

	    $('.login-button').on('click', function() {

	    	spotifyLogin();
	    	
	    });

		console.log('access denied');
	}

		$('.convert-button').on('click', function() {

	   $('.modal').modal({

	   		dismissible: true //change this once algorithm is completed        
	    });

	    $('#modal3').modal('open');

		});
});

function playlistClicked(item) {
	console.log('FINALLY');
	console.log(item[0].dataset.tracks);
	$('.button-collapse').sideNav('hide');
}

  