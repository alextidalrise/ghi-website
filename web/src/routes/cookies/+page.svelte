<script lang="ts">
	import LegalPage from '$lib/components/LegalPage.svelte';
</script>

<LegalPage title="Cookie policy" updated="20 July 2026">
	<h2>What cookies we use</h2>
	<p>
		We use a small number of cookies. Some are essential for the site to work; the rest
		are only set if you agree to them. You can change your mind at any time.
	</p>

	<div class="legal-table-scroll">
		<table>
			<thead>
				<tr>
					<th>Cookie</th>
					<th>Purpose</th>
					<th>Expires</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>ghi_consent</td>
					<td>
						Remembers your cookie choices so we do not ask again on every visit. Stores
						only your choices, a version number and the date — nothing that identifies
						you. Essential.
					</td>
					<td>180 days</td>
				</tr>
				<tr>
					<td>launch_bypass</td>
					<td>Lets our team preview the site before launch. Essential.</td>
					<td>30 days</td>
				</tr>
				<tr>
					<td>_ga, _ga_*</td>
					<td>
						Google Analytics. Measures how the site is used so we can improve it. Only
						set if you accept analytics cookies.
					</td>
					<td>Up to 2 years</td>
				</tr>
				<tr>
					<td>_gcl_au</td>
					<td>
						Google advertising. Only set if you accept marketing cookies. We do not
						currently run advertising.
					</td>
					<td>90 days</td>
				</tr>
			</tbody>
		</table>
	</div>

	<h2>Before you choose</h2>
	<p>
		Until you make a choice, no analytics or advertising cookies are set. Google's tools
		may still receive a basic, cookieless record that a page was viewed, which cannot be
		used to identify you or to build a profile.
	</p>

	<h2>Changing your mind</h2>
	<p>
		You can change or withdraw your consent at any time. When you withdraw it, we delete
		the analytics and advertising cookies listed above. You can also clear cookies in
		your browser settings at any point.
	</p>

	<h2>Questions</h2>
	<p>
		If you would like to know more about how we handle your information, see our
		<a href="/privacy">privacy policy</a> or <a href="/contact">contact us</a>.
	</p>
</LegalPage>
