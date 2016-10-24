<div class="row">
	<div class="col-lg-9">
		<div class="panel panel-default">
			<div class="panel-heading">Lingvist Social Authentication</div>
			<div class="panel-body">
				<form role="form" class="sso-lingvist-settings">
					<div class="form-group">
						<label for="id">OAuth ID</label>
						<input type="text" id="id" name="id" title="OAuth ID" class="form-control" placeholder="OAuth ID"><br />
					</div>
					<div class="form-group">
						<label for="secret">OAuth Password</label>
						<input type="text" id="secret" name="secret" title="OAuth Password" class="form-control" placeholder="OAuth Password">
					</div>

					<div class="form-group">
						<label for="authorization_url">Authorization URL</label>
						<input type="text" id="authorization_url" name="authorization_url" title="OAuth Authorization URL" class="form-control" placeholder="OAuth Authorization URL">
					</div>
					<div class="form-group">
						<label for="token_url">Token URL</label>
						<input type="text" id="token_url" name="token_url" title="OAuth Token URL" class="form-control" placeholder="OAuth Token URL">
					</div>

					<p class="help-block">
						The appropriate "Redirect URI" is your NodeBB's URL with `/auth/lingvist/callback` appended to it.
					</p>
					<div class="checkbox">
						<label for="showSiteTitle" class="mdl-switch mdl-js-switch mdl-js-ripple-effect">
							<input type="checkbox" class="mdl-switch__input" id="showSiteTitle" name="autoconfirm" />
							<span class="mdl-switch__label">Skip email verification for people who register using SSO?</span>
						</label>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>

<button id="save" class="floating-button mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored">
	<i class="material-icons">save</i>
</button>

<script>
	require(['settings'], function(Settings) {
		Settings.load('sso-lingvist', $('.sso-lingvist-settings'));

		$('#save').on('click', function() {
			Settings.save('sso-lingvist', $('.sso-lingvist-settings'), function() {
				app.alert({
					type: 'success',
					alert_id: 'sso-lingvist-saved',
					title: 'Settings Saved',
					message: 'Please reload your NodeBB to apply these settings',
					clickfn: function() {
						socket.emit('admin.reload');
					}
				})
			});
		});
	});
</script>