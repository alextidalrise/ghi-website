<script lang="ts">
	import type { CustomBlockComponentProps } from '@portabletext/svelte';
	import type { InsightPartnerProfileBlock } from '$lib/insights/types';
	import {
		buildPublicImageUrl,
		buildImageSrcset,
		getImagePlaceholder,
		getImageDimensions
	} from '$lib/sanity/image';

	let { portableText }: { portableText: CustomBlockComponentProps<InsightPartnerProfileBlock> } =
		$props();

	const value = $derived(portableText.value);
	// The team layout swaps the portrait + credential plate for a single uncropped landscape team
	// photo, stacked between the heading and the copy. Same panel shell either way.
	const isTeam = $derived(value.layout === 'teamLandscape');
	const heading = $derived(value.heading?.trim() || null);
	const personName = $derived(value.personName?.trim() || null);
	const personRole = $derived(value.personRole?.trim() || null);
	const paragraphs = $derived(
		(value.body ?? '')
			.split(/\n\s*\n/)
			.map((para) => para.trim())
			.filter(Boolean)
	);

	const portrait = $derived(
		buildPublicImageUrl(value.portrait, { width: 480, height: 600, fit: 'crop', quality: 82 })
	);
	const portraitSrcset = $derived(
		buildImageSrcset(value.portrait, [240, 320, 480, 640], {
			width: 480,
			height: 600,
			fit: 'crop',
			quality: 82
		})
	);
	const portraitLqip = $derived(getImagePlaceholder(value.portrait));
	const portraitAlt = $derived(value.portrait?.altText?.trim() || personName || '');

	// The partner's reversed mark (`logoAlt`) — a light logo made for dark surfaces — shown as-is on
	// the brand-green credential plate, matching the approved design. Only shown when the partner
	// reference carries an alt logo; the wall `logo` (dark, for white cells) is deliberately not used
	// here.
	const logo = $derived(
		buildPublicImageUrl(value.partner?.logoAlt, { width: 120, height: 120, fit: 'max', quality: 90 })
	);
	const logoAlt = $derived(value.partner?.name ? `${value.partner.name} logo` : '');

	// The team photograph is shown UNCROPPED: width only, no height and no crop fit, so the CDN scales
	// it to its natural landscape ratio. Intrinsic dimensions set width/height for CLS, and the frame
	// takes the ratio from those attributes rather than a forced aspect-ratio.
	const teamImage = $derived(
		buildPublicImageUrl(value.teamImage, { width: 1280, quality: 82 })
	);
	const teamSrcset = $derived(
		buildImageSrcset(value.teamImage, [480, 640, 800, 1024, 1280, 1600, 1920], { width: 1280, quality: 82 })
	);
	const teamLqip = $derived(getImagePlaceholder(value.teamImage));
	const teamDims = $derived(getImageDimensions(value.teamImage));
	const teamAlt = $derived(value.teamImage?.altText?.trim() || heading || '');
</script>

{#if isTeam}
	{#if heading && paragraphs.length > 0}
		<!-- Team layout: same panel shell (tinted ground, hairline border, heading + body type,
		     spacing), but a single column — heading, then an uncropped landscape team photograph,
		     then the partnership copy. No credential plate: this introduces a firm, not one person. -->
		<section class="partner-profile partner-profile--team" aria-label={heading}>
			<h3 class="partner-profile__heading">{heading}</h3>
			{#if teamImage}
				<figure class="partner-profile__team">
					<div
						class="partner-profile__team-frame"
						style:background-image={teamLqip ? `url(${teamLqip})` : undefined}
					>
						<img
							src={teamImage}
							srcset={teamSrcset || undefined}
							sizes="(max-width: 46rem) 88vw, min(58rem, 66vw)"
							alt={teamAlt}
							width={teamDims?.width ?? undefined}
							height={teamDims?.height ?? undefined}
							loading="lazy"
							decoding="async"
						/>
					</div>
				</figure>
			{/if}
			<div class="partner-profile__body">
				{#each paragraphs as para (para)}
					<p>{para}</p>
				{/each}
			</div>
		</section>
	{/if}
{:else if heading && paragraphs.length > 0}
	<section class="partner-profile" aria-label={heading}>
		<h3 class="partner-profile__heading">{heading}</h3>
		<div class="partner-profile__grid">
			<div class="partner-profile__body">
				{#each paragraphs as para (para)}
					<p>{para}</p>
				{/each}
			</div>

			{#if portrait || personName}
				<figure class="partner-profile__person">
					{#if portrait}
						<div
							class="partner-profile__portrait"
							style:background-image={portraitLqip ? `url(${portraitLqip})` : undefined}
						>
							<img
								src={portrait}
								srcset={portraitSrcset || undefined}
								sizes="(max-width: 46rem) 45vw, 13rem"
								alt={portraitAlt}
								width="480"
								height="600"
								loading="lazy"
								decoding="async"
							/>
						</div>
					{/if}
					{#if personName}
						<figcaption class="partner-profile__plate">
							{#if logo}
								<img class="partner-profile__logo" src={logo} alt={logoAlt} loading="lazy" decoding="async" />
							{/if}
							<span class="partner-profile__name">{personName}</span>
							{#if personRole}
								<span class="partner-profile__role">{personRole}</span>
							{/if}
						</figcaption>
					{/if}
				</figure>
			{/if}
		</div>
	</section>
{/if}

<style>
	.partner-profile {
		margin-block: clamp(2.25rem, 5vw, 3.25rem);
		padding: clamp(1.5rem, 4vw, 2.5rem);
		border: 1px solid var(--border);
		background: var(--surface-tint);
	}

	.partner-profile__heading {
		margin: 0 0 var(--space-lg);
		font-family: var(--serif);
		font-size: var(--text-h2);
		font-weight: 400;
		line-height: 1.15;
		color: var(--green);
		text-wrap: balance;
	}

	.partner-profile__grid {
		display: grid;
		gap: clamp(1.5rem, 4vw, 2.5rem);
	}

	/* Team layout: the uncropped landscape team photo between the heading and the copy. No forced
	   aspect-ratio — the frame takes its ratio from the image's width/height attributes, so the photo
	   is never cropped. A hairline frame defines it against the tinted panel ground. */
	.partner-profile__team {
		margin: 0 0 clamp(1.5rem, 4vw, 2.5rem);
	}

	.partner-profile__team-frame {
		overflow: hidden;
		border: 1px solid var(--border);
		background: var(--green);
		background-size: cover;
		background-position: center;
	}

	.partner-profile__team-frame img {
		display: block;
		width: 100%;
		height: auto;
	}

	.partner-profile__body {
		min-width: 0;
	}

	.partner-profile__body p {
		margin: 0;
		font-family: var(--sans);
		font-size: var(--text-body);
		line-height: 1.7;
		color: var(--charcoal);
		max-width: 60ch;
		text-wrap: pretty;
	}

	.partner-profile__body p + p {
		margin-top: var(--space-md);
	}

	.partner-profile__person {
		margin: 0;
		align-self: start;
	}

	.partner-profile__portrait {
		aspect-ratio: 4 / 5;
		overflow: hidden;
		background: var(--green);
		background-size: cover;
		background-position: center;
	}

	.partner-profile__portrait img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* The credential plate: the person's name and role on the brand green, with the partner mark
	   knocked out to light above them — a brand lockup beneath the face. */
	.partner-profile__plate {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding: var(--space-md);
		background: var(--green);
		color: var(--on-green);
	}

	.partner-profile__logo {
		width: auto;
		height: 2rem;
		max-width: 6rem;
		margin-bottom: var(--space-sm);
		object-fit: contain;
		object-position: left center;
	}

	.partner-profile__name {
		font-family: var(--sans);
		font-weight: 600;
		font-size: var(--text-ui);
		line-height: 1.3;
	}

	.partner-profile__role {
		font-family: var(--sans);
		font-size: var(--text-small);
		line-height: 1.4;
		color: color-mix(in srgb, var(--on-green) 82%, transparent);
	}

	/* Two columns once there is room: the copy leads, a fixed portrait column supports. Below
	   46rem the portrait stacks under the copy and takes a comfortable, capped width. */
	@media (min-width: 46rem) {
		.partner-profile__grid {
			grid-template-columns: minmax(0, 1fr) 13rem;
			align-items: start;
		}
	}

	@media (max-width: 45.99rem) {
		.partner-profile__person {
			max-width: 16rem;
		}
	}
</style>
