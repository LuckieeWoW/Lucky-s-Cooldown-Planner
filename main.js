	// INITIALIZE #######################




	// draggable snap tolerance (pixels)
	var ui_snap_tolerance = 10;
	var ui_draggable_cursor = 'grabbing';
	var is_dragging = false;
	var is_menu_up = false;
	const scrollbar_width = 20; // pixels, kludge to estimate size of scroll bar so our cdmenu() doesn't appear off screen.

	// does MRT automatically apply class colors to known names?  If so we don't need this (make it false).
	const do_colorize_names = false;

	// localStorage name prefix
	const storageprefix = 'raid-cd-planner:';
	const storagekey_encounterprefix = 'encounter:';
	const storagekey_savedencounters = storageprefix + 'saved-encounters';
	const storagekey_lastencounter = storageprefix + 'last-encounter';

	// get list of stored encounters
	var saved_encounters = JSON.parse( localStorage.getItem(storagekey_savedencounters) ) || new Array();
	//========================== TEMPORARY TESTING
	// saved_encounters = new Array('Rashok - Mythic');
	//==========================


	// get the column width from CSS
	var events_column_width = getComputedStyle(document.documentElement).getPropertyValue('--events-column-width');
	// get the row height from CSS
	var spell_row_height = getComputedStyle(document.documentElement).getPropertyValue('--spell-row-height');
	// get player column width from CSS
	var player_column_width = getComputedStyle(document.documentElement).getPropertyValue('--player-column-width');
	var encounter_events_height = getComputedStyle(document.documentElement).getPropertyValue('--encounter-events-height');
	// get actual height of encounter events wrapper, since it won't be exactly the encounter events height (200px?) once the horizontal scroll bar is subtracted. (~183px)
	var encounter_events_innerHeight = document.getElementById('encounter-events-wrapper').offsetHeight;

	var timeline_time_height = getComputedStyle(document.documentElement).getPropertyValue('--timeline-time-height');

	var max_encounter_time = getComputedStyle(document.documentElement).getPropertyValue('--max-encounter-time');



	// remove the "px" from the values so we can use them in calculations later.
	var events_column_width_num = Number(events_column_width.replace('px',''));
	var spell_row_height_num = Number(spell_row_height.replace('px',''));
	var player_column_width_num = Number(player_column_width.replace('px',''));
	var encounter_events_height_num = Number(encounter_events_height.replace('px',''));
	var timeline_time_height_num = Number(timeline_time_height.replace('px',''));





	// element that reflects the current horizontal scroll position
	// var el_horiz_scroll = 'belowhead';
	const el_horiz_scroll = 'encounter-events';
	// element that reflects the current vertical scroll position on the spellsarea
	const el_vert_scroll = 'belowhead';


	const event_template = `
	<div class="timeline-event {extra-classes}" id="{id}" data-time="{mm:ss}" {data-duration} {data-severity} {data-cond} {data-cond-spellid} {data-cond-counter} {data-cond-phase} style="left: {x}px; height: calc(var(--events-column-width) * {duration});"><!--eventname--></div>
	`;

	const event_shadow_template = `
	<aside class="timeline-event-shadow" id="shadow-for-{id}" {data-severity} style="left: calc(var(--player-column-width) + {x}px); height: 100%;"></aside>
	`;

	const roster_template_head = `
	<tr>
		<td class="players-col">
			<div class="spells-head expanded" data-spelltype="{spelltype}">{heading}</div>
		</td>
		<td class="spells-head-blank"></td>
	</tr>
	`;

	const roster_template = `
	<tr class="{spelltype}">
		<td class="players-col">
			<div data-spellid="{spellid}" data-duration="{cooldown}" data-player="{player}" data-spellname="{spellname}" class="class-{class}"><small>{player}<samp>{cooldown}</samp></small><a href="{whurl}{spellid}">{spellname}</a></div>
		</td>
		<td class="spellsarea-td">
			<!--{actions}-->
		</td>
	</tr>
	`;

	const roster_template_customaction = `
	<tr class="tr-nohover {spelltype}">
		<td class="players-col">
			<div style="background: var(--header-bgcolor);">{text}</div>
		</td>
		<td class="spellsarea-td" id="custom-action-td">
			<!--{actions}-->
		</td>
	</tr>
	`;

	const roster_template_empty = `
	<tr class="tr-nohover">
		<td class="players-col">
			<div style="background: var(--header-bgcolor);"></div>
		</td>
		<td class="spellsarea-td"></td>
	</tr>
	`;

	const roster_template_multispell = `
	<tr class="{spelltype}">
		<td class="players-col">

			<!-- the DIV is now a placeholder for a hidden fake dropdown, so our  'TD.players-col > DIV' continue to function as is.  Changing the dropdown below it will modify the DIV's spellid, etc. appropriately. -->

			<div id="selected-{player}-{spellid}" data-spellid="{spellid}" data-duration="{cooldown}" data-player="{player}" data-spellname="{spellname}" class="class-{class} spellchoice" onclick="click_spellchoice(event);"><small>{player}<samp>{cooldown}</samp></small>{spellname}</div>

			<!-- since <select> doesn't allow any html inside it, make our own using <ul> and JS -->
			<ul id="spellchoice-{player}-{spellid}" class="spellchoice-menu class-{class}">
				<!--{options}-->
			</ul>

		</td>
		<td class="spellsarea-td" id="usage-{player}-{spellid}">
			<!--{actions}-->
		</td>
	</tr>
	`;
	const roster_template_multispell_option = `
	<li data-spellid="{ew-spellid}" data-duration="{ew-cooldown}" data-player="{player}" data-spellname="{ew-spellname}" onclick="click_spellchoice_menu_item(this, 'selected-{player}-{spellid}')"><small>{player}<samp>{ew-cooldown}</samp></small>{ew-spellname}</li>
	`;

	const cd_template = `
	<div id="cd-{id}" data-spellid="{spellid}" data-player="{player}" class="draggable class-{spellclass}-light" style="top: 0; left: calc(var(--events-column-width) * {col}); width: calc(var(--events-column-width) * {cooldown});">
		<span class="class-{spellclass}">
			<a class="menu" href="#" onclick="show_cdmenu('{id}'); return false;">&#x2630;</a> {spellname} <small>{player}</small>
		</span>
		<code id="note-{id}"><span><!--{note}--></span></code>
		<!-- cooldown-markers -->
	</div>
	`;

	const cd_shadow_template = `
	<aside class="cd-shadow {spellclass}">{spellname}<small>{player}</small></aside>
	`;

	var roster_by_class = {};

	// as we add spells to the interface, keep track of each spell added so that we don't add any that are mutually exclusive with others. [see display_spells()]
	var spells_displayed = {};

	// global to store the <tr> for the Custom Actions row.
	var tr_custom_actions;









	//######################################
	function get_spells_of_type(type) {
		// go through all known spells and return only the ones of the matching type
		// to group them by class, go through list of spells already sorted by class (class_spells{})
		var type_spells = new Array();

		/* old way, ungrouped */
		// for (var spellid in spells) {
		// 	if (typeof spells[spellid].type !== 'undefined' && spells[spellid].type == type) {
		// 		Array.prototype.push.call(type_spells, spellid);
		// 	}
		// }

		/* grouped by class */
		for (var classname in class_spells) {

			// console.log(classname, class_spells[classname]);

			// if (class_spells[classname] && (class_spells[classname].length > 0)) {
				class_spells[classname].forEach((spellid, i_spell) => {

					// console.log(i_spell, spellid);

					if (typeof spells[spellid].type !== 'undefined' && spells[spellid].type == type) {
						Array.prototype.push.call(type_spells, spellid);
					}
				});
			// }

		} /* foreach class in class_spells */

		return type_spells;

	} // get_spells_of_type()





	var spells_major = get_spells_of_type('Major CDs');
	// console.log(spells_major);
	var spells_minor = get_spells_of_type('Minor CDs');
	// console.log(spells_minor);
	var spells_DR = get_spells_of_type('Damage Reduction');
	// console.log(spells_DR);
	var spells_utility = get_spells_of_type('Utility');
	// console.log(spells_utility);
	var spells_mobility = get_spells_of_type('Mobility');
	// console.log(spells_mobility);
	var spells_other = get_spells_of_type('');
	// console.log(spells_other);








	//######################################
	// populate list of saved encounters
	function populateEncounterList(current_encounter_name) {

		// if no encounter name specified for selection, use the last known encounter name
		if (!current_encounter_name) {
			current_encounter_name = last_encounter_name || '';
		}

		// get list of saved encounters from localstorage
		var regex = new RegExp('^'+ storagekey_encounterprefix);
		var saved_encounters = Object.keys(localStorage).filter(key =>  regex.test(key)) || new Array();

		// sort the encounter list alphabetically
		saved_encounters = saved_encounters.sort();

		// console.log(saved_encounters);
		var h = '';
		var selected = '';

		for (var i = 0; i < saved_encounters.length; i++) {

			// remove the prefix from the name
			saved_encounters[i] = saved_encounters[i].replace(regex, '');

			// console.log(saved_encounters[i], current_encounter_name);

			// if it's the currently-selected option (last_encounter_name), add the 'selected' attribute.
			selected = (saved_encounters[i] === current_encounter_name)? ' selected="selected"' : '';

			h += '<option value = "'+ saved_encounters[i] + '"'+ selected +'>' + saved_encounters[i] + '</option>';
		}
		document.getElementById('encounter-select').innerHTML = h;

	} //populateEncounterList()





	//######################################
	function display_encounter_events() {

		// console.log(encounter_events);

		// NO, don't quit.  Must still display timeline with seconds indicators.
		// if (Object.keys(encounter_events).length === 0) return;

		var h;

		// for faster processing, prepare a list of the encounter events above keyed by the position on the timeline (position: the horizontal position in seconds, or its column)
		var encounter_events_by_time = {};
		if (!jQuery.isEmptyObject(encounter_events)) {
			encounter_events.forEach((item, i) => {

				// get the column (timeline position) for this event
				// if using an older version of the data that doesn't have 'position' data, calculate it based on its time value
				if (typeof(item.position) == 'undefined') {
					item.position = convert_MMSS_to_seconds(item.time);
				}

				// if nothing exists at this time yet, create a new array to hold this and any other events sharing this time
				if ( typeof(encounter_events_by_time[item.position]) == 'undefined') {
					encounter_events_by_time[item.position] = new Array();
				}
				encounter_events_by_time[item.position].push(item);
			});
			// console.log(encounter_events_by_time);
		}

		// clear any existing encounter events
		// $('#encounter-events-wrapper').empty();
		document.getElementById('encounter-events-wrapper').replaceChildren();
		// get rid of their shadow lines, too
		document.querySelectorAll('.timeline-event-shadow').forEach(function(el, i) {
			el.remove();
		});


		// display the timeline, one element for each second
		h = '';
		var x;
		for (var s = 0; s < max_encounter_time; s++) {
			x = s * events_column_width_num;
			h = '<div class="timeline-time" style="left: '+ x +'px;">'+ convert_seconds_to_MMSS(s) +'</div>';
			$('#encounter-events-wrapper').append($(h));
		}

		// display the encounter events

		h = '';
		var mmss;
		for (var s = 0; s < max_encounter_time; s++) {

			// if there's an encounter event for this this, include it
			if (encounter_events_by_time[s]) {

				h = event_template;

				// calculate the X position (seconds) in the timeline
				x = s * events_column_width_num;

				// mmss = convert_seconds_to_MMSS(s);	// NO... `mmss` is based on `s` only if condition is [start of encounter].  Otherwise it represents the time after fulfilment of condition.  See further below for mmss handling.

				h = h.replaceAll('{s}', s);	// DEPRECATED
				h = h.replaceAll('{x}', x);

				// there may be more than one (but should/probably never be)
				encounter_events_by_time[s].forEach((evnt, i) => {
					// console.log(s, evnt);

					// get a unique ID for this element
					var id = get_unique_id();

					// sanitize default values
					evnt.name = evnt.name || '';
					evnt.time = evnt.time || '';
					evnt.duration = evnt.duration || '';
					evnt.severity = evnt.severity || '';
					evnt.cond = evnt.cond || '';
					evnt.spellid = evnt.spellid || '';
					evnt.counter = evnt.counter || '';
					evnt.phase = evnt.phase || '';
					// console.log(evnt);

					// if event is based on a variable time such as P, SAA, SAR, SCS, SCC, then add "draggable-event" classname to it.
					var extra_classes = '';
					var mmss = '';
					switch (evnt.cond) {
						case 'phase':
						case 'saa':
						case 'sar':
						case 'scs':
						case 'scc':
							extra_classes = 'draggable-event';
							mmss = evnt.time;
							break;
						case '':
						case 'start':
							mmss = convert_seconds_to_MMSS(s);
							break;
					}

					// if applicable, add phase / SAA / SAR / etc. to event name prefix
					var dispname = get_event_condition_display(evnt.name, evnt.cond, mmss, evnt.spellid, evnt.counter, evnt.phase);

					var h2 = h;
					// fill the rest of the template
					h2 = h2.replaceAll('{id}', id);
					h2 = h2.replaceAll('{mm:ss}', mmss);
					h2 = h2.replaceAll('{data-duration}', 'data-duration="'+ evnt.duration +'"');
					h2 = h2.replaceAll('{duration}', evnt.duration);
					h2 = h2.replaceAll('{data-severity}', 'data-severity="'+ evnt.severity +'"');
					h2 = h2.replaceAll('<!--eventname-->', '' + dispname);
					h2 = h2.replaceAll('{data-cond}', 'data-cond="'+ evnt.cond +'"');
					h2 = h2.replaceAll('{data-cond-spellid}', 'data-cond-spellid="'+ evnt.spellid +'"');
					h2 = h2.replaceAll('{data-cond-counter}', 'data-cond-counter="'+ evnt.counter +'"');
					h2 = h2.replaceAll('{data-cond-phase}', 'data-cond-phase="'+ evnt.phase +'"');
					h2 = h2.replaceAll('{extra-classes}', extra_classes);

					// create the element on the timeline
					// $('#encounter-events-wrapper').append($(h2));

					// create a corresponding faint event bar in the lower #spellsarea
					var shadow_htm = event_shadow_template;
					shadow_htm = shadow_htm.replaceAll('{id}', id);
					shadow_htm = shadow_htm.replaceAll('{x}', x);
					shadow_htm = shadow_htm.replaceAll('{data-severity}', 'data-severity="'+ evnt.severity +'"');

					// var new_elem = $('#spellsarea-wrapper').append($(shadow_htm));

					// TO DO: once this works, delete the redundant blocks above
					var el_new = display_encounter_event({
						's': s,	// seconds
						'id': get_unique_id(),
						'name': evnt.name,
						'time': evnt.time,
						'duration': evnt.duration,
						'severity': evnt.severity,
						'cond': evnt.cond,
						'spellid': evnt.spellid,
						'counter': evnt.counter,
						'phase': evnt.phase,
					});



				}); // forEach encounter_events_by_time[s]

			} // if there is an event at this timestamp

		} /* for every second in the encounter timeline */

		// draw visual link between any flexible (SAA/SAR/etc.) events
		draw_event_connectors();

	} // display_encounter_events()





	//######################################
	function display_encounter_event(evnt) {

		// console.log(evnt);

		h = event_template;

		// calculate the X position (seconds) in the timeline
		x = evnt.s * events_column_width_num;

		// h = h.replaceAll('{s}', s);	// DEPRECATED
		h = h.replaceAll('{x}', x);

		// get a unique ID for this element
		var id = get_unique_id();

		// sanitize default values
		evnt.name = evnt.name || '';
		evnt.time = evnt.time || '';
		evnt.duration = evnt.duration || '';
		evnt.severity = evnt.severity || '';
		evnt.cond = evnt.cond || '';
		evnt.spellid = evnt.spellid || '';
		evnt.counter = evnt.counter || '';
		evnt.phase = evnt.phase || '';
		// console.log(evnt);

		// if event is based on a variable time such as P, SAA, SAR, SCS, SCC, then add "draggable-event" classname to it.
		var extra_classes = '';
		var mmss = '';
		switch (evnt.cond) {
			case 'phase':
			case 'saa':
			case 'sar':
			case 'scs':
			case 'scc':
				extra_classes = 'draggable-event';
				mmss = evnt.time;
				break;
			case '':
			case 'start':
				mmss = convert_seconds_to_MMSS(evnt.s);
				break;
		}

		// if applicable, add phase / SAA / SAR / etc. to event name prefix
		var dispname = get_event_condition_display(evnt.name, evnt.cond, mmss, evnt.spellid, evnt.counter, evnt.phase);

		// fill the rest of the template
		h = h.replaceAll('{id}', id);
		h = h.replaceAll('{mm:ss}', mmss);
		h = h.replaceAll('{data-duration}', 'data-duration="'+ evnt.duration +'"');
		h = h.replaceAll('{duration}', evnt.duration);
		h = h.replaceAll('{data-severity}', 'data-severity="'+ evnt.severity +'"');
		h = h.replaceAll('<!--eventname-->', '' + dispname);
		h = h.replaceAll('{data-cond}', 'data-cond="'+ evnt.cond +'"');
		h = h.replaceAll('{data-cond-spellid}', 'data-cond-spellid="'+ evnt.spellid +'"');
		h = h.replaceAll('{data-cond-counter}', 'data-cond-counter="'+ evnt.counter +'"');
		h = h.replaceAll('{data-cond-phase}', 'data-cond-phase="'+ evnt.phase +'"');
		h = h.replaceAll('{extra-classes}', extra_classes);

		// first create the new element (it will be returned to the caller for potential use in the editEvent() call.)
		var el = $(h);
		// create the element on the timeline
		$('#encounter-events-wrapper').append(el);

		// create a corresponding faint event bar in the lower #spellsarea
		var shadow_htm = event_shadow_template;
		shadow_htm = shadow_htm.replaceAll('{id}', id);
		shadow_htm = shadow_htm.replaceAll('{x}', x);
		shadow_htm = shadow_htm.replaceAll('{data-severity}', 'data-severity="'+ evnt.severity +'"');

		$('#spellsarea-wrapper').append($(shadow_htm));

		return el;

	} //display_encounter_event()





	//######################################
	// using global `roster`, display all players' spells and any associated `actions` on the timeline.
	function display_spells() {

		// clear the existing roster
		document.getElementById('spellsarea').innerHTML = '';	// instant

		var new_elem, htm;

		// as we add spells to the interface, keep track of each spell added so that we don't add any that are mutually exclusive with others.
		spells_displayed = {};	// reset the global

		// organize by:
		//	major CDs, by class, by player
		//	minor CDs, by class, by player
		//	DRs, by class, by player
		//	mobilities, by class, by player
		//	utilities, by class, by player

		display_spells_of_type(spells_major, 'Major CDs');
		display_spells_of_type(spells_minor, 'Minor CDs');
		display_spells_of_type(spells_DR, 'Damage Reduction');
		display_spells_of_type(spells_utility, 'Utility');
		display_spells_of_type(spells_mobility, 'Mobility');
		display_spells_of_type(spells_other, 'Other');


		// always include an extra row at the bottom for adding custom spells/actions
		htm = roster_template_customaction;
		htm = htm.replaceAll('{text}', 'Place custom actions in this row ->');
		htm = htm.replaceAll('{spelltype}', 'spelltype-Other');

		// find any custom actions in the encounter and include them.  They're the actions without any `spellid`
		var col;
		var actions_htm = '';

		for (var i=0; i < actions.length; i++) {

			if ( (actions[i].spellid == null) || (actions[i].spellid == 'null') ) {

				// console.log('Adding custom action ', actions[i].player, actions[i].note);

				// get column given x-coordinate
				col = Math.round(actions[i].x / events_column_width_num);

				actions_htm += get_cd_htm(null, actions[i].player, col, actions[i].note);
			}
		}
		// console.log('Adding html for custom action(s): ', actions_htm);
		htm = htm.replace('<!--{actions}-->', actions_htm);

		new_elem = $('#spellsarea').append($(htm));


		// store that custom actions element in a global so it's available to the Add Custom Action function.
		tr_custom_actions = document.getElementById('custom-action-td');

		// and a spacer row at the bottom
		htm = roster_template_empty;
		htm = htm.replaceAll('{text}', '');
		new_elem = $('#spellsarea').append($(htm));

	} // display_spells()




	//######################################
	// displays spells of one type in the roster area. (Called by display_spells().)
	function display_spells_of_type(spells_of_type, heading) {

		// console.log(spells_of_type);

		// heading
		htm = roster_template_head;
		htm = htm.replaceAll('{heading}', heading);

		// prepare spelltype for use as a classname
		spelltype = 'spelltype-' + heading.replaceAll(/\s+/g,'-');
		// console.log(heading, spelltype);

		htm = htm.replaceAll('{spelltype}', spelltype);
		new_elem = $('#spellsarea').append($(htm));

		// CDs of this type
		spells_of_type.forEach((spellid, i_spell) => {

			var classname = spells[spellid].class;
			// console.log(spellid, i_spell, spells[spellid].name, classname, spells[spellid].spec);

			/* new way. Handles spec-agnostic spells */
			display_spell_for_class_specs(spellid, classname, spells[spellid].spec);
		});

	} // display_spells_of_type()




	//######################################
	// display spells for this class [and spec, if any]
	// if spec-specific we need to display this spell only for classes of the matching spec.
	// if spec-agnostic we need to look for players of any spec of this class.
	function display_spell_for_class_specs(spellid, classname, specname) {

		// if there are any of this class...
		// console.log(roster_by_class[class_spec]);
		if (typeof(roster_by_class[classname]) === 'undefined') {
			console.log('no '+ classname +' players.');
		} else {

			// for each player of this class [& spec], add them
			var addspell;
			var mmss;

			roster_by_class[classname].forEach( (player, player_i) => {

				// if spec specified, only include this spell if it's for the same spec
				if (specname > '') {
					if (roster[player].spec == specname) {
						// add
						// console.log('Adding '+ spells[spellid].name +' for player ' + player_i, player, classname, specname + ' == ' + roster[player].spec);
						addspell = true;
					} else {
						// console.log('NOT Adding '+ spells[spellid].name +' for player ' + player_i, player, classname, specname + ' != ' + roster[player].spec);
						addspell = false;
					}
				} else {
					// console.log('Adding specless '+ spells[spellid].name +' for player ' + player_i, player, classname, specname + ' == ' + roster[player].spec);
					addspell = true;
				}

				// finally check to ensure this spell isn't mutually exclusive with another spell that's already been added.  (We added mutually all exclusive spells at the same time as the primary spell.)
				if (spells_displayed[player + '-' + spellid] !== undefined) {
					// this spell was already added as a dropdown option under another spell.  Skip it.
					addspell = false;
					// console.log("Already added a mutually exclusive spell so skipping "+ player + '-' + spellid);
				}


				if (addspell) {

					var htm_li = '';
					var cdhtm = '';
					var main_spellid = spellid;	// the main spellid will be the default, unless one of the mutually exclusive spells is found to be used in the encounter's actions timeline.

					// which template to use?  If spell is mutually exclusive with others, use the multispell template.  Otherwise use the single spell template.
					if (spells[spellid].exclusivewith !== undefined) {

						htm = roster_template_multispell;

						var htm_options = '';

						// add the mutually exclusive spells to our list of displayed spells so they won't be included on their own further down the list.
						// NOTE: while adding each spell alternative to the dropdown, we'll also be gathering any instances of this spell from the encounter we're displaying.  At the same time, keeping track of which spell alternative is used in the encounter, to determine which one gets displayed by default.

						var ew_spellid;
						for (var ew_i = 0; ew_i < spells[spellid].exclusivewith.length; ew_i++) {

							ew_spellid = spells[spellid].exclusivewith[ew_i];
							
							// console.log(ew_i, ew_spellid);

							// add to displayed spells
							spells_displayed[ player + '-' + ew_spellid ] = true;

							htm_li = get_htm_for_multispell_li(ew_spellid, player);

							htm_options += htm_li;

							// see if this players' spell appears on the timeline.  If it does, then set this to be the main spell displayed in the div (further below).
							for (var i=0; i < actions.length; i++) {
								if ( (actions[i].player == player) && (actions[i].spellid == ew_spellid) ) {
									main_spellid = ew_spellid;
									// console.log('Using main spellid ', ew_spellid);
									break;
								}
							}
						}

						// note: the main/already-selected spell has to be included as one of the items in the dropdown, too.

						htm_li = get_htm_for_multispell_li(spellid, player);

						htm_options += htm_li;

						htm = htm.replace('<!--{options}-->', htm_options);

					} else {
						// it's a standalone spell.
						htm = roster_template;
						main_spellid = spellid;
					}

					// add this spell to the list of spells added so far, so we can avoid adding spells mutually exclusive with others (i.e. talent choice nodes)
					spells_displayed[player + '-' + main_spellid] = true;


					// prepare the mm:ss and shortenable prefix for the spell cooldown
					mmss = convert_seconds_to_MMSS(spells[main_spellid].cooldown);
					if (spells[main_spellid].shortenable) {
						mmss = '~' + mmss;
					}

					// prepare spelltype for use as a classname
					spelltype = 'spelltype-' + spells[main_spellid].type.replaceAll(/\s+/g,'-');

					// swap in values
					htm = htm.replaceAll('{spellid}', main_spellid);
					htm = htm.replaceAll('{spellname}', spells[main_spellid].name);
					htm = htm.replaceAll('{cooldown}', mmss );
					htm = htm.replaceAll('{class}', classname);
					htm = htm.replaceAll('{player}', player);
					htm = htm.replaceAll('{spelltype}', spelltype);
					// if this spell is only being used for its icon in the MRT note, and the spell name will be overridden (such as "Personals", "Health Potion", etc.) then don't make it a wowhead link
					if (spells[main_spellid].override_spellname) {
						htm = htm.replaceAll('{whurl}', '#');
					} else {
						htm = htm.replaceAll('{whurl}', whurlbase);
					}

					// if this players' spell appears on the timeline (`actions` object), include it.
					// see if there are any actions matching this player and spellid.  There may be many.
					cd_htm = '';
					for (var i=0; i < actions.length; i++) {
						if ( (actions[i].player == player) && (actions[i].spellid == main_spellid) ) {

							// get column given x-coordinate
							col = Math.round(actions[i].x / events_column_width_num);

							// console.log('add:', actions[i], actions[i].x, col, actions[i].player, actions[i].spellid);

							cd_htm += get_cd_htm(main_spellid, player, col, actions[i].note);
						}
					}

					// add those spell(s) to the actions column for this row
					htm = htm.replaceAll('<!--{actions}-->', cd_htm);

					new_elem = $('#spellsarea').append($(htm));
				}
			}); //forEach(roster_by_class)
		} // there exist players of this class

	} // display_spell_for_class_specs()







	//######################################
	// make draggable spells draggable
	function make_spells_draggable(obj_to_make_draggable) {

		// optionally pass in a single element to make it draggable without having to act on all ".draggable" elements (for speed). (TO DO)
		// if we do receive a single object to make draggable, be sure to return the modified object!  Otherwise return nothing.

		var els;
		var return_el = false;

		if (typeof(obj_to_make_draggable) !== 'undefined') {
			// make only this specific element draggable.  Assume it's a jquery object.
			els = obj_to_make_draggable;
			return_el = true;
			// console.log('using obj_to_make_draggable');
		} else {
			// make all ".draggable" elements draggable
			els = $('.draggable');
			// console.log('using all ".draggable"');
		}
		// console.log(els);

		// $('.draggable').draggable({
		els.draggable({
			axis: 'x',
			// snap: true,	/* no need for snapping to other draggables */
			// containment: 'parent',	/* contain within the <td> parent */
			containment: [-999999, 0, 999999, 0],	/* not perfect, but within the `drag:` function we can further restrain its left extent. */
			scroll: true,
			snapTolerance: ui_snap_tolerance,
			cursor: ui_draggable_cursor,

			// snap to grid based on timeline scale, at whole seconds
			grid: [events_column_width_num, 1],

			// when dragging a spell, attach a guide to its left edge to help line it up with timeline events, above it.
			drag: function(event, ui) {

				// ensure left position is pixel-perfect on a timeline column
				// console.log(event, ui.position.left, Math.round(ui.position.left / events_column_width_num) * events_column_width_num);
				var left_new = Math.round(ui.position.left / events_column_width_num) * events_column_width_num + .1; // +.1 to ensure we can reach the left-most column.
				if (left_new < 0) {
					left_new = 0;
				}
				ui.position.left = left_new;
				

				// set the guide's left position
				var el = document.getElementById('timeline-guide');
				el.style.left = Number(ui.position.left + player_column_width_num) + 'px';
				// size its height based on the bounding box
				el.style.top = 0;
				el.style.height = document.getElementById('spellsarea').clientHeight +'px';
			},
			start: function(event, ui) {
				$('#timeline-guide').show();
				// temporarily turn off the column & row bars indicating where the pointer is
				$('#timeline-bar-v').hide();
				$('#timeline-bar-h').hide();
				// make the horizontal timeline-bar hidden (TR:hover) by removing its trigger class
				$('#spellsarea').removeClass('show-timeline-bars');

				is_dragging = true;
			},
			stop: function(event, ui) {
				$('#timeline-guide').hide();
				// turn on the column & row bars for the pointer
				$('#timeline-bar-v').hide();
				$('#timeline-bar-h').hide();
				// make the horizontal timeline-bar shown (TR:hover) by adding its trigger class
				$('#spellsarea').addClass('show-timeline-bars');

				is_dragging = false;

				// save the changes
				saveEncounter();
			},

		});
		// console.log(els);

		if (return_el) return els;

	} //make_spells_draggable()






	//######################################
	function make_events_draggable() {
		// makes any qualifying event draggable. (needs ".draggable-event" class)
		var els = $('.draggable-event');

		els.draggable({
			axis: 'x',
			// snap: true,	/* no need for snapping to other draggables */
			containment: 'parent',
			scroll: true,
			snapTolerance: ui_snap_tolerance,
			cursor: ui_draggable_cursor,
			disabled: false,	/* in case it was previously made undraggable, i.e. the via lock icon */

			// snap to grid based on timeline scale, at whole seconds
			grid: [events_column_width_num, 1],

			drag: function(event, ui) {
				// console.log(event, ui);
				// console.log(encounter_events_innerHeight, timeline_time_height_num);

				// must correct 'top' attribute with every redraw
				ui.position.top = encounter_events_innerHeight - timeline_time_height_num;

				// ensure left position is pixel-perfect on a timeline column
				// console.log(ui.position.left, Math.round(ui.position.left / events_column_width_num) * events_column_width_num);
				ui.position.left = Math.round(ui.position.left / events_column_width_num) * events_column_width_num;

				// move this event's shadow bar to the same x-position as the event we're dragging.
				var shadow_el = document.getElementById('shadow-for-' + event.target.id);
				shadow_el.style.left = (ui.position.left + player_column_width_num) + 'px';

				// move subsequent SAA/SAR/etc. events the same amount as this one
				// (update: don't try this... would need to sort elements by x-position on the timeline if we want to do this)
				/*
				// console.log(ui);
				var left_orig = Math.round(ui.originalPosition.left / events_column_width_num) * events_column_width_num;
				var left_diff = ui.position.left - left_orig;
				console.log(left_orig, left_diff);
				// find all SAA/SAR/etc. events after this one's original position
				var subsequent_els = document.querySelectorAll('.timeline-event[data-cond]:not([data-cond=""])');	// where data-cond is NOT empty.  i.e. it's one of: phase,saa,sar,scs,scc
				if (subsequent_els) {
					for (var i = 0; i < subsequent_els.length; i++) {
						// see if this event came after the original position of the one being dragged.
						console.log(left_orig, left_diff, subsequent_els[i], Number(subsequent_els[i].getAttribute('original-drag-x')));
						if (Number(subsequent_els[i].getAttribute('original-drag-x')) > left_orig) {

							// if this element doesn't already contain its original position from the time we started dragging, store it now.  We'll use this to update its position (based on its original position minus `left_diff`)
							if (subsequent_els[i].getAttribute('original-drag-x') == null) {
								subsequent_els[i].setAttribute('original-drag-x', subsequent_els[i].offsetLeft);
							}

							console.log('Moving id '+ subsequent_els[i].id);
							subsequent_els[i].style.left = (Number(subsequent_els[i].getAttribute('original-drag-x')) + left_diff) + "px";
						}
					}
				}
				*/

				// update connectors between any SAA/SAR/etc. events after a short delay
				setTimeout(function() {
					draw_event_connectors();
				}, 10);

			},
			start: function(event, ui) {
				$('#timeline-guide').show();
				// temporarily turn off the column & row bars indicating where the pointer is
				$('#timeline-bar-v').hide();
				$('#timeline-bar-h').hide();
				// make the horizontal timeline-bar hidden (TR:hover) by removing its trigger class
				$('#encounter-events-wrapper').removeClass('show-timeline-bars');

				is_dragging = true;
			},
			stop: function(event, ui) {
				$('#timeline-guide').hide();
				// turn on the column & row bars for the pointer
				$('#timeline-bar-v').hide();
				$('#timeline-bar-h').hide();
				// make the horizontal timeline-bar shown (TR:hover) by adding its trigger class
				$('#encounter-events-wrapper').addClass('show-timeline-bars');

				is_dragging = false;

				// if we were dragging an SAA/SAR/etc. event, they may have "original-drag-x" attributes we now need to remove.
				var temp_els = document.querySelectorAll('.timeline-event[original-drag-x]');
				if (temp_els) {
					for (var i = 0; i < temp_els.length; i++) {
						temp_els[i].removeAttribute('original-drag-x');
					}
				}

				// for static (non-SAA/SAR/etc.) events, update the 'data-time' attribute to reflect its new static position on the timeline.
				var el = event.target;
				// console.log(el.getAttribute('data-time'));
				if (el.getAttribute('data-cond') === '') {

					// calculate time from x position
					var seconds = ui.position.left / events_column_width_num;
					// convert seconds to mm:ss
					var mmss = convert_seconds_to_MMSS(seconds);
					// store that in data-time attribute
					el.setAttribute('data-time', mmss);
				}

				// save the changes
				saveEncounter();
			},

		});

	} //make_events_draggable()




	//######################################
	// given page coordinates at X, Y (e.g. mouse pointer location), return that cell(column & row) in the #spellsarea.
	function get_spellsarea_cell_from_pageXY(pageX, pageY) {

		// console.log(pageX, pageY);

		var spellsarea_el = document.getElementById('spellsarea');
		var spellsarea_x = pageX - spellsarea_el.offsetLeft + document.getElementById(el_horiz_scroll).scrollLeft - 9;	/* 9px correction... see below in show_mouseover_cell() */
		var spellsarea_y = pageY - spellsarea_el.offsetTop - encounter_events_height_num + document.getElementById(el_vert_scroll).scrollTop;

		// console.log(pageX, pageY, spellsarea_el.offsetLeft, document.getElementById(el_horiz_scroll).scrollLeft, spellsarea_x);
		// console.log(pageX, pageY, spellsarea_el.offsetTop, document.getElementById(el_vert_scroll).scrollTop, spellsarea_y);

		var col = Math.floor(spellsarea_x / events_column_width_num);
		var row = Math.floor(spellsarea_y / spell_row_height_num);
		// console.log(col, row);

		return {'col': col, 'row': row};

	} //get_spellsarea_cell_from_pageXY()





	//######################################
	// show which column/row is under the pointer
	function show_mouseover_cell(e) {

		// get coordinates over the spellsarea grid (regardless of what child target the pointer is actually over)

		cell = get_spellsarea_cell_from_pageXY(e.pageX, e.pageY);
		// console.log(cell.col, cell.row);

		// size the timeline bar so it doesn't extend beyond #spellsarea and cause scroll bars
		var spellsarea_el = document.getElementById('spellsarea');
		// horizontal bar width
		// var bar_w = spellsarea_el.clientWidth;

		// move the visual timeline marker to the column & row under the pointer
		var bar_x, bar_y;
		var el_v = document.getElementById('timeline-bar-v');

		// vertical bar
		bar_x = (cell.col * events_column_width_num) + 9;	/* 9px correction... see above in get_spellsarea_cell_from_pageXY() */
		bar_y = 0;

		// don't allow the timeline bar to appear overtop of the left column (.players-col)
		if (bar_x > player_column_width_num) {
			el_v.style.left = bar_x + 'px';
			el_v.style.top = bar_y + 'px';
			// el_v.style.height = '100%'; //(bar_h - 2) + 'px';
		}

		// horizontal bar (only applies when pointer is not over the spells column (.players-col))
		// set the html to show the spell info for that row.
		var el_h = document.getElementById('timeline-bar-h');

		// bar_x = 0;
		bar_y = (cell.row * spell_row_height_num);

		// set its position
		el_h.style.left = bar_x + 'px';
		el_h.style.top = bar_y + 'px';

		// set its html
		var htm = '';
		// look up the player's spell corresponding to the row we're moused over
		// var spellrows = document.querySelectorAll('#spellsarea TD.players-col > DIV');
		var spellrows = document.querySelectorAll('#spellsarea TR:not([class*="collapsed"]) TD.players-col > DIV');	// excludes hidden rows
		// console.log(spellrows);
		// console.log(spellrows[cell.row]);

		// get spell id, name, class and player for that row.
		var el = spellrows[cell.row];
		var spellid = el.getAttribute('data-spellid');

		// check the mouseover target (if there's a DIV in the target's ancestors, we're over a spell/action)
		// console.log(e.target);
		var not_over_div = (e.target.closest('.spellsarea-td > DIV') === null);
		// console.log(not_over_div);
		var not_over_spellchoice_menu = (e.target.closest('UL.spellchoice-menu') === null);


		// if spellid is null, nothing to display.
		// also, don't allow the timeline bar to appear overtop of the left column (.players-col)
		// also, don't allow the timeline bar to appear over any existing actions.
		// also, don't allow the timeline bar to appear under any spell choice menu.
		if (spellid !== null && spellid !== 'null' && (bar_x > player_column_width_num) && not_over_div && not_over_spellchoice_menu) {
			var spellclass = el.getAttribute('class');
			var spellname = el.getAttribute('data-spellname');
			var player = el.getAttribute('data-player');

			htm = cd_shadow_template;
			htm = htm.replaceAll('{spellclass}', spellclass);
			htm = htm.replaceAll('{spellname}', spellname);
			htm = htm.replaceAll('{player}', player);
			// console.log(htm);
		}
		el_h.innerHTML = htm;


		if (!is_dragging) {
			$('#timeline-bar-v').show();
			$('#timeline-bar-h').show();
		}
	} //show_mouseover_cell()

	// setup listeners for mousing over the #spellsarea.
	document.getElementById('spellsarea').addEventListener('mousemove', show_mouseover_cell);





	//######################################
	// hide the #timeline-bar when the mouse isn't over #spellsarea
	function hide_mouseover_cell(e) {
		$('#timeline-bar-v').hide();
	} //hide_mouseover_cell()

	document.getElementById('spellsarea').addEventListener('mouseleave', hide_mouseover_cell);





	//######################################
	// adds a CD to the spellsarea.  Given parent cell (`parent_el`), player, spellid, spell name, class and timeline column.
	function addCDtoTimeline(parent_el, spellid, spellname, spellclass, player, col, note) {

		var cd_htm = get_cd_htm(spellid, player, col, note);


		// make it draggable *then* append it?
		// var elem_draggable = make_spells_draggable( $(htm) );
		// var new_elem = $('#spellsarea').append( $(elem_draggable) );

		// make that element draggable
		// make_spells_draggable(new_elem);


		// var new_elem = $('#spellsarea').append($(htm));
		var new_elem = $(parent_el).append($(cd_htm));

		// workaround: just make all ".draggable" elements draggable.
		make_spells_draggable();

		// save the changes
		saveEncounter();

	} //addCDtoTimeline()





	//######################################
	// returns the html for displaying a spell/action on the #spellsarea timeline grid.
	function get_cd_htm(spellid, player, col, note) {

		// given spellid, get class and name
		var spellclass = '', spellname = '', cooldown = '';

		// spellid may be null, i.e. for adding a custom action.
		if (spellid !== null) {
			spellclass = spells[spellid].class;
			spellname = spells[spellid].name;
			cooldown = spells[spellid].cooldown;
		}

		// var px_y = spell_row_height_num * row;	// deprecated

		// get a unique ID for this element
		var id = get_unique_id();

		// prepare markers every 30 seconds along the cooldown timeline
		var cdmarks_htm = '';
		var cdmark_mmss = '';
		if (cooldown > 30) {
			// first mark is at cooldown minus 30 sec.
			// next mark(s) are every 30 seconds prior but never more than 10 seconds from start of spell.
			var safety = 0;
			for (var cdmark = 30; cdmark < (cooldown - 10); cdmark += 30) {

				// console.log('cdmark for '+ spellname +' at '+ cdmark);
				safety++;
				if (safety > 100) break;

				// we'll need the mm:ss version of the cdmark (seconds)
				cdmark_mmss = convert_seconds_to_MMSS(cdmark);
				// we don't need any leading zero on it
				cdmark_mmss = cdmark_mmss.replace(/^0/,'');

				cdmarks_htm += '<samp style="left: calc(var(--events-column-width) * calc('+ cooldown +' - '+ cdmark +'));">'+ cdmark_mmss +'</samp>';
			}
		}

		// if note isn't empty, add quotes around it.
		if ( (note !== undefined) && (note > '') ) {
			note = '"' + note + '"';
		} else {
			// ensure we're not displaying 'undefined'.
			note = '';
		}

		// if player is null, display empty string, not the word 'null'.
		if ( (player === null) || (player == 'null') ) player = '';

		// build the html element to be inserted
		var htm = cd_template;
		htm = htm.replaceAll('{id}', id);
		htm = htm.replaceAll('{spellid}', spellid);
		htm = htm.replaceAll('{player}', player);
		htm = htm.replaceAll('{spellname}', spellname);
		htm = htm.replaceAll('{spellclass}', spellclass);
		// htm = htm.replaceAll('{row}', row);		// deprecated
		// htm = htm.replaceAll('{px_y}', px_y);	// deprecated
		htm = htm.replaceAll('{col}', col);
		htm = htm.replaceAll('{cooldown}', cooldown);
		htm = htm.replaceAll('<!-- cooldown-markers -->', cdmarks_htm);
		htm = htm.replaceAll('<!--{note}-->', note);


		return htm;

	} //get_cd_htm()





	//######################################
	// capture click on spellsarea:
	function click_spellsarea(e) {

		// console.log(e);
		// console.log(e.target);
		// console.log(e.target.offsetParent);


		// if clicked on a spell on the timeline (#spellsarea), offsetParent will either be the <div> or the <code> within the div.
		var id = e.target.offsetParent.id || '';

		// if nothing worthwhile was clicked, we won't be adding a spell to the timeline.
		if (id == '' || id == 'spellsarea-wrapper') {
			// if menu was already up, don't continue with the left-click functionality of adding a spell to the timeline
			if (is_menu_up) {
				closeAllMenus();
				return;
			}
		}

		// (removed right-click on spells in timeline from here... after adding mutually-exclusive spell options - 20240630)


		// if a spell category (spelltype) header was clicked, handle its event.
		if (e.target.offsetParent.classList.contains('players-col')) {
			// the spells column was clicked... now see if this is a column header. (if the clicked element has a child of class 'spells-head')

			// console.log(e.target.offsetParent.querySelector('.spells-head'));
			var spellhead_el = e.target.offsetParent.querySelector('.spells-head');
			if (spellhead_el) {
				// a spell header was clicked
				// get the spelltype to be toggled

				// console.log(e.target.getAttribute('data-spelltype'));
				var spelltype = spellhead_el.getAttribute('data-spelltype');
				// console.log(spelltype);

				toggle_spelltypes(spelltype);
			}
		}

		// ensure an empty area was clicked. i.e. not clicking on a spell that's already there for dragging.
		if (!e.target.classList.contains('spellsarea-td')) {
			// close any open menu and don't continue below
			if (is_menu_up) closeAllMenus();
			return;
		}



		// the parent element to which we'll add the spell div is the table cell
		var parent_el = e.target;

		// we can get row number from the table row
		var row = e.target.parentElement.rowIndex;
		// console.log(row);

		// calculate column clicked
		var col = Math.floor(e.offsetX / events_column_width_num);
		// console.log(e.offsetX, col);

		// if left button clicked, insert the spell onto the #spellsarea
		if (e.button == 0) {

			// look up the player's spell corresponding to the row clicked
			var spellrows = document.querySelectorAll('#spellsarea TD.players-col > DIV');
			// console.log(spellrows);
			// console.log(spellrows[row]);

			// get spell id, name, class and player for that row.
			var el = spellrows[row];
			var spellid = el.getAttribute('data-spellid');
			var spellclass = el.getAttribute('class');
			var spellname = el.getAttribute('data-spellname');
			var player = el.getAttribute('data-player');

			// if insufficient data, don't do anything. (e.g. spell type header)
			// console.log(spellid, spellname, spellclass, player);
			if (spellclass == 'spells-head') return;
			// if spellid is null, they clicked on the "add custom action" row.  Show its dialog.
			if (spellid == null) {
				// store the x-position (or column?) they clicked into the custom action dialog
				document.getElementById('custom-action-col').value = col;
				document.getElementById('custom-action-old-id').value = '';	// adding a new one, not editing an existing one, so null this.
				document.getElementById('custom-action-dialog').showModal();
			} else {
				var note = '';
				addCDtoTimeline(parent_el, spellid, spellname, spellclass, player, col, note);
			}

		} // button == 0 (left-click)

	} //click_spellsarea()

	// set up listener for clicking on spells area
	// document.getElementById('spellsarea').addEventListener('mousedown', click_spellsarea);
	document.getElementById('spellsarea').addEventListener('click', click_spellsarea, true);	// click instead of mousedown to keep contextmenu functionality






	//######################################
	function click_eventsarea(e) {

		// only clickable on empty area...
		// clicking on a blank area will be '#encounter-events-wrapper'
		// clicking on a timeline's time area will be '.timeline-time', so its parent will be the '#encounter-events-wrapper'

		// console.log(is_dragging);
		if (is_dragging) {
			// we've probably just dropped a draggable event, so do nothing here. (is_dragging will be falsified by the draggable handler.)
			return;
		}

		// if a spell/actions menu was already up, don't continue with the left-click functionality.
		if (is_menu_up) {
			closeAllMenus();
			return;
		}

		var id = e.target.id || '';
		// console.log(id, e.offsetX, e.offsetY, e.target, e.target.offsetParent);

		// mouse may have moved off the initial mousedown target.  If so, ignore this click.
		//	Note this will allow mousedown->drag->release anywhere within the "blank" area of the timeline, but not if your mousedown was over an event or a timestamp.
		// console.log(e.target, eventsarea_mouseup_target);
		if (e.target !== eventsarea_mouseup_target) return;


		var col;
		if (id == 'encounter-events-wrapper') {
			// they clicked on blank area within the timeline
			// calculate the column clicked
			var col = Math.floor(e.offsetX / events_column_width_num);
		} else {
			// see if they clicked on a timestamp along the timeline
			if (e.target.classList.contains('timeline-time')) {
				// get the x coodinate for this timeline-time div
				var colx = e.target.offsetLeft;

				// calculate column clicked
				var col = Math.floor(colx / events_column_width_num);

				// if there already exists a timeline event at this column, edit it.  Otherwise, proceed below to creating a new one.
				// go through existing timeline events to see if the x-coordinate matches this column
				var skip_new_event = false;
				$('.timeline-event').each(function (i, el) {

					// console.log(el.style.left, colx, (Number(el.style.left.replace('px','')) == colx));

					if (Number(el.style.left.replace('px','')) == colx) {
						// found an event at this column.
						// open it for editing and don't proceed below.
						console.log('Editing existing event.');
						// console.log(el);
						editEvent(el);
						skip_new_event = true;
						return;
					}
				});

				// above we found an event at this column, so don't proceed below to create a new event.
				// console.log(skip_new_event);
				if (skip_new_event) return;

			} else if (e.target.classList.contains('timeline-event')) {
				// click target is probably a timeline-event.  Open it's event dialog.
				editEvent(e.target);
				// don't proceed below with creating a new event.
				return;
			} else {
				// maybe a <span> within the timeline-event was clicked.  Check for that
				if (e.target.offsetParent.classList.contains('timeline-event')) {
					// click target is probably a timeline-event.  Open it's event dialog.
					editEvent(e.target.offsetParent);
				}
				// don't proceed below with creating a new event.
				return;
			}
		}

		// if left button clicked, insert a new event
		if (e.button == 0) {
			console.log('Creating new event at column ' + col);

			// create new event at this column, and open the editEvent dialog to modify it
			// default the new event to seconds-from-encounter-start
			var h = event_template;

			// seconds corresponds to column number
			h = h.replaceAll('{s}', col);	// DEPRECATED
			// x-coordinate is column * column width
			h = h.replaceAll('{x}', col * events_column_width_num);
			h = h.replaceAll('{mm:ss}', convert_seconds_to_MMSS(col));

			// get a unique ID for this element and fill it in the html
			h = h.replaceAll('{id}', get_unique_id());

			h = h.replaceAll('{data-duration}', 'data-duration="1"');
			h = h.replaceAll('{duration}', '1');
			h = h.replaceAll('{data-severity}', 'data-severity=""');
			h = h.replaceAll('{severity}', '');
			h = h.replaceAll('{data-cond}', 'data-cond=""');
			h = h.replaceAll('{data-cond-spellid}', 'data-cond-spellid=""');
			h = h.replaceAll('{data-cond-counter}', 'data-cond-counter=""');
			h = h.replaceAll('{data-cond-phase}', 'data-cond-phase=""');
			h = h.replaceAll('{extra-classes}', '');
			h = h.replaceAll('<!--eventname-->', 'New event');

			// create the element on the timeline
			// var el = $(h);
			// var el = $('#encounter-events-wrapper').append($(h));
			// $('#encounter-events-wrapper').append(el);
			// console.log(el);

			// TO DO: once this works, delete the redundant blocks above
			var el = display_encounter_event({
				's': col,	// seconds
				'id': get_unique_id(),
				'name': 'New event',
				'time': convert_seconds_to_MMSS(col),
				'duration': 1,
				'severity': '',
				'cond': '',
				'spellid': '',
				'counter': '',
				'phase': '',
			});

			console.log(el);


			// open the editEvent dialog
			editEvent(el[0]);	// pass the native DOM element

		} // (e.button == 0)

	} //click_eventsarea()

	// set up listener for clicking on spells area
	document.getElementById('encounter-events-wrapper').addEventListener('click', click_eventsarea);





	// track mousedown so we can avoid frustrating mouseups that moved away from the initial mousedown target.
	var eventsarea_mouseup_target;	// global
	function mouseup_eventsarea(e) {
		eventsarea_mouseup_target = e.target;
	} //mouseup_eventsarea()
	document.getElementById('encounter-events-wrapper').addEventListener('mouseup', mouseup_eventsarea);






	//######################################
	// show spell action menu when clicking on hamburger menu of spells within timeline
	function show_cdmenu(cd_id) {

		// console.log('show_cdmenu('+ cd_id +')');

		// the menu element
		var el_id = 'cdmenu';
		var el = document.getElementById(el_id);

		// fill the menu contents
		// if the spell/action we're showing the menu for has multiple players (e.g. a Custom Action might), the menu changes slightly.
		// look up the players associated with this action
		var act_el = document.getElementById('cd-' + cd_id);
		var p = act_el.getAttribute('data-player') || '';
		// multiple players would be comma separated
		if (p.indexOf(',') === -1) {
			// single player
			var h = `
			<ul>
				<li><a href="#" onclick="editNote('{cd_id}'); return false;">Edit Note</a></li>
				<li><a href="#" onclick="removeCD('{cd_id}'); return false;">Remove</a></li>
			</ul>
			`;
		} else {
			// multiple players
			var h = `
			<ul>
				<li><a href="#" onclick="editAction('{cd_id}'); return false;">Edit</a></li>
				<li><a href="#" onclick="removeCD('{cd_id}'); return false;">Remove</a></li>
			</ul>
			`;
		}
		h = h.replaceAll('{cd_id}', cd_id);
		el.innerHTML = h;


		// move the menu to under the mouse
		// mouse coordinates: Y minus encounter header height
		// console.log(event.clientX, event.clientY, player_column_width, encounter_events_height);
		var spellsframe = document.getElementById('spellsarea-wrapper');
		el.style.left = (event.clientX - spellsframe.offsetLeft + spellsframe.scrollLeft) + 'px';
		el.style.top = (event.clientY - spellsframe.offsetTop + spellsframe.scrollTop) + 'px';


		// console.log(cd_id);
		$('#' + el_id).show();
		el.style.display = 'block';
		is_menu_up = true;


		// reposition menu if it's off-screen
		var r = el.getBoundingClientRect();

		// if top plus height of menu is off the screen
		if ( (r.top - spellsframe.offsetTop) + r.height > spellsframe.offsetHeight - scrollbar_width) {
			// current mouse position but extending upwards instead of down
			el.style.top = (event.clientY - spellsframe.offsetTop + spellsframe.scrollTop) - r.height + 'px';
		}

		// if left plus width of menu is off the screen
		if ( (r.left - spellsframe.offsetLeft) + r.width > spellsframe.offsetWidth - scrollbar_width) {
			// current mouse position but extending left instead of right
			el.style.left = (event.clientX - spellsframe.offsetLeft + spellsframe.scrollLeft) - r.width + 'px';
		}

		// set up event so the menu hides automatically if moused away for a time
		// (we no longer want it to close automatically)
		$('#' + el_id).mouseleave(function() {
			/*
			setTimeout(function() {
				$('#' + cd_id).hide()
			}, 200);
			*/

			// no delay.  The delay wasn't cancellable by re-hovering over the target anyways.  TO DO: do that, or else leave this hiding immediately.
			// $('#' + el_id).hide();
		});

	} //show_cdmenu()





	//######################################
	// function to add/edit text note on a CD from the #spellsarea, (under the hamburger menu)
	function editNote(cd_id) {

		var id = 'note-' + cd_id;
		var el = document.getElementById(id);

		// get current note
		var txt = el.innerText;

		// remove outer quotes
		txt = txt.replace(/^"(.*)"$/, '$1');

		// hide any menus
		closeAllMenus();

		// prompt for edited note
		var newtxt = prompt('Edit note:', txt);
		if (newtxt !== null) {
			// only add quotes if text is not blank
			if (newtxt > '') newtxt = '"' + newtxt + '"';
			// saved edited note
			el.innerHTML = '<span>' + escape_html(newtxt) + '</span>';

			// save the changes
			saveEncounter();
		}

	} //editNote()





	//######################################
	// open the custom actions editing dialog
	function editAction(cd_id) {

		// hide any menus
		closeAllMenus();

		// populate the edit-custom-action dialog with note & player(s) from this custom action.  Then show the dialog.
		var el = document.getElementById('cd-' + cd_id);

		var note = '';
		if (el.getElementsByTagName('code')) {
			note = el.getElementsByTagName('code')[0].innerText;
			// remove outer quotes
			note = note.replace(/^"(.*)"$/, '$1');
			// finally convert any other unwanted html entities
			note = unescape_html(note);
		}

		var players = el.getAttribute('data-player');

		var x = el.offsetLeft;
		// calculate column based on x-position
		var col = Math.round(x / events_column_width_num);

		// set the note, col, and player(s)
		document.getElementById('custom-action-col').value = col;
		document.getElementById('custom-action-note').value = note;
		document.getElementById('custom-action-old-id').value = cd_id;

		// there should already be a list of checkboxes for each player and special things like {everyone}, etc.  Check the appropriate values and uncheck the rest.
		// turn players into an array
		var p = players.split(', ');
		console.log(p);
		// go over all '#custom-action-player-list > INPUT' and if any match the names in our custom action, put a check in their box.
		var els = document.querySelectorAll('#custom-action-player-list INPUT').forEach(function(el, i) {
			// see if the el's value matches one of the players
			p.forEach(function(name) {
				console.log(name, el.value);
			});
		});

		document.getElementById('custom-action-dialog').showModal();

	} //editAction()





	//######################################
	// function to remove a CD from the #spellsarea, (under the hamburger menu)
	function removeCD(cd_id) {

		// var id = 'cd-' + cd_id;

		cd_id = cd_id.replace(/^cdmenu/,'cd');
		// console.log(cd_id);

		// remove that spell from the #spellsarea
		$('#cd-' + cd_id).remove();

		// also hide the menu
		closeAllMenus();

		// save the changes
		saveEncounter();

	} //removeCD()





	//######################################
	// generate MRT note based on spell placements
	//
	// for formatting, see:
	//	https://wago.io/MRT_Note_Timers
	//	https://www.wowhead.com/guide/writing-a-good-exorsus-raid-tools-note-11624
	//	https://github.com/SeaStove/Chuffed-Method-Raid-Tools-Notes
	//
	function generate_MRT_note() {

		var MRTnote = '';

		// read encounter events and player spells.  These will be merged into the MRT note.



		// *****************************************
		// TO DO: convert the code below that gathers events & actions to use the gatherEncounterData() function, then convert that into arrays indexed by seconds. (to avoid a divergence in code between this and gatherEncounterData().)
		//
		// var encounter_data = gatherEncounterData();
		// *****************************************



		var events = {};
		var player_spells = {};

		// get all encounter events
		$('#encounter-events-wrapper > DIV.timeline-event').each(function (i, el) {

			// get the event text
			var eventname = el.innerHTML;
			// remove the <span> (time) portion from the innerHTML
			eventname = eventname.replaceAll(/<span[^>]*?>.*<\/span>/gi, '');
			// also remove any placeholder that might be there
			eventname = eventname.replaceAll('<!--eventname-->', '');

			// if the event is empty, skip it.
			if (eventname == '') return;

			// turn the x-coordinate position of this event into whole seconds (essentially what column the event is in).
			var seconds = Math.round(el.offsetLeft / events_column_width_num);

			// add this event to the list of events
			// events[el.getAttribute('data-time')] = {
			events[seconds] = {
				'name': unescape_html(eventname),
				// 'duration': el.getAttribute('data-duration'),
				'severity': el.getAttribute('data-severity'),
				'cond': el.getAttribute('data-cond'),
				'cond-spellid': el.getAttribute('data-cond-spellid'),
				'cond-phase': el.getAttribute('data-cond-phase'),
				'cond-counter': el.getAttribute('data-cond-counter'),
				'time': el.getAttribute('data-time'),	// mm:ss ...may differ from `seconds` based on `cond`!
			};
		});
		// console.log(events);


		// TO DO?: read phase positions from encounter events timeline.  Use these to determine when events come after phase transitions



		// get all draggable DIVs within #spellsarea with data-spellid attribute
		$('#spellsarea .draggable[data-spellid]').each(function (i, el) {

			// calculate timestamp (seconds) based on pixel coordinates
			var seconds = $(el).position().left / events_column_width_num;

			// console.log(i, el, el.getAttribute('data-spellid'), el.getAttribute('data-player'), $(el).position().left, seconds);

			// add this event to the list of player_spells
			// player_spells is keyed to each second, and contains an array of all spells occurring at that timestamp
			if (typeof player_spells[seconds] == 'undefined') {
				player_spells[seconds] = new Array();
			}

			// extract the name of the class from the css classes on this element
			var wowclassname = el.className.split(' ').filter((classname) => classname.indexOf('class-') !== -1);
			// (there should only ever be at most one wow class on these divs... just ensure we have no more than one.)
			if (wowclassname.length > 0) {
				wowclassname = wowclassname[0].replace('class-', '').replace('-light', '');
			}
			// console.log(wowclassname);

			// get the note from any <code> child of this element
			var note;
			if (el.getElementsByTagName('code')) {
				note = el.getElementsByTagName('code')[0].innerText;
				// remove outer quotes
				note = note.replace(/^"(.*)"$/, '$1');
				// finally convert any other unwanted html entities
				note = unescape_html(note);
			}

			// get some attributes from the main spells{} data
			var spellid = el.getAttribute('data-spellid');
			// spellid may be null for e.g. custom actions
			var override_spellname = false;
			if (spellid && spellid !== 'null') {
				override_spellname = (typeof(spells[spellid].override_spellname) === undefined)? false : spells[spellid].override_spellname || false;
			}

			// add to the array of player spells for this second.
			player_spells[seconds].push({
				'player': el.getAttribute('data-player'),
				'spellid': spellid,
				'note': note,
				'class': wowclassname,
				'override_spellname': override_spellname,
			});
		});
		// console.log(player_spells);


		// go through every second of the encounter.  See if there is an event and/or player spells assigned to that second, and include them in the note.
		var addLF;
		var mmss;
		var spellid_raw;

		for (var s = 0; s < max_encounter_time; s++) {

			// only add newline to end if there was any text added to the note
			addLF = false;

			// if either an event or a spell occurs at this time, include a time prefix in the MRTnote
			addtime = false;	// default to false.  See below.

			// if there's an event or action at this timestamp, display the time in the note
			if ( (typeof(events[s]) !== 'undefined') || (typeof(player_spells[s]) !== 'undefined') ) {

				// it's possible there are player spells without an event at this time.  If so, get time based on [from-start-of-encounter] condition
				if (typeof(events[s]) == 'undefined') {
					// there is no event at this point in the timeline.  Treat as 'start' condition.
					MRTnote += '{time:' + convert_seconds_to_MMSS(s) + '}'; 

				} else {
					// there is an event at this point in the timeline
					switch(events[s].cond) {
						case '':
						case 'start':
							MRTnote += '{time:' + convert_seconds_to_MMSS(s) + '}'; 
							break;
						case 'phase':
							MRTnote += '{time:' + events[s].time + ',p'+ events[s]['cond-phase'] + '}';
							break;
						case 'saa':
						case 'sar':
						case 'scs':
						case 'scc':
							cond_upper = events[s].cond.toUpperCase();
							MRTnote += '{time:' + events[s].time + ',' + cond_upper + ':' + events[s]['cond-spellid'] + ':' + events[s]['cond-counter'] + '}';
							break;
					}
				} // there is an event

			} // if there's an event or action at this timestamp

			// events
			if (typeof(events[s]) !== 'undefined') {
				// console.log('add', events[s]);
				MRTnote += events[s].name + '  ';
				addLF = true;
			}
			// player spells
			var displayname;
			if (typeof(player_spells[s]) !== 'undefined') {

				player_spells[s].forEach((item, i) => {
					// console.log('add', item);

					// some of our spellids are of the format {spellid}-{cooldown}.  Convert these to only spellid for use in MRT note.
					spellid_raw = item.spellid.split('-')[0];

					// some spells require overriding spell names.  Include in item.note
					var note = item.note || '';
					if (item.override_spellname) {
						// if note isn't empty, prefix it with a space
						if (note !== '') note = ' ' + note;
						// add spell name in {text} block
						note = '{text}'+ spells[item.spellid].name + note +'{/text}';
					}

					if (do_colorize_names) {
						displayname = '|cff' + get_RGB_for_class(item.class) + item.player + '|r';
					} else {
						displayname = item.player;
					}

					MRTnote += displayname + '{spell:' + spellid_raw + '}' + note + '  '; // generous spacing between spells
					addLF = true;
				});
			}
			// add newline
			if (addLF) MRTnote += '\n';

		} // for every second (s) in the encounter

		// console.log(MRTnote);
		$('#mrtnote-contents').text(MRTnote);
		$('#mrtnote-overlay').show();

		// select the text.
		document.getElementById('mrtnote-contents').select();

	} //generate_MRT_note()





	//######################################
	// save full encounter data: encounter events, roster, actions.
	//
	// TO DO: probably keep a variable storing this with every change made within the interface, so we don't need to read it from the domdocument here.  Also, we probably need undo/redo functionality.
	//
	function saveEncounter(optional_new_name, optional_encounter_data) {

		// if optional_new_name provided, save this encounter under that name.
		// Otherwise save it as the currently loaded name for this encounter.
		var encounter_name;
		if (optional_new_name && optional_new_name.length > 0) {
			encounter_name = optional_new_name;
		} else {
			// get encounter name
			encounter_name = $('#encounter-select').val() || '(unnamed encounter)';
		}
		console.log('Saving as ' + encounter_name);

		// if optional encounter data passed in, use it.  Otherwise read it from the DOM.
		var encounter_data;
		if (typeof(optional_encounter_data) !== 'undefined') {
			encounter_data = optional_encounter_data;
		} else {
			encounter_data = gatherEncounterData();
		}

		// save to localstorage
		var key = storagekey_encounterprefix + encounter_name;
		localStorage.setItem(key, JSON.stringify(encounter_data));

		// add this to the list of saved encounters, if it's not already there
		addToSavedEncounters(encounter_name);

	} //saveEncounter()





	//######################################
	// adds an encounter name to the list of saved encounters (global `saved_encounters`).
	function addToSavedEncounters(encounter_name) {

		// console.log(saved_encounters, encounter_name, saved_encounters.indexOf(encounter_name));
		if (saved_encounters.indexOf(encounter_name) == -1) {
			// Not in list.  Add it.
			console.log('Adding ' + encounter_name + ' to list of saved encounters.');
			saved_encounters.push(encounter_name);
			console.log(saved_encounters);

			// update the saved list of encounters
			localStorage.setItem(storagekey_savedencounters, JSON.stringify(saved_encounters));
			// console.log(JSON.parse(localStorage.getItem(storagekey_savedencounters)));
		}

	} //addToSavedEncounters()




	//######################################
	function gatherEncounterData() {

		// encounter events (use the global `encounter_events` so anything that needs to quickly lookup whether there is an event at a given time can do so)
		encounter_events = new Array();

		// get all encounter events
		$('#encounter-events-wrapper > DIV.timeline-event').each(function (i, el) {

			// get the event text
			var eventname = el.innerHTML;
			// remove the <span> (time) portion from the innerHTML
			eventname = eventname.replaceAll(/<span[^>]*?>.*<\/span>/gi, '');

			// if the event is empty, skip it.
			if (eventname == '') return;

			// turn the x-coordinate position of this event into whole seconds (essentially what column the event is in).
			var eventcolumn = Math.round(el.offsetLeft / events_column_width_num);

			// add this event to the list of events
			encounter_events.push( {
				'position': eventcolumn,
				'name': eventname,
				'time': el.getAttribute('data-time'),	/* time from fulfillment of condition in mm:ss */
				'duration': el.getAttribute('data-duration'),

				'cond': el.getAttribute('data-cond'),
				'phase': el.getAttribute('data-cond-phase'),
				'spellid': el.getAttribute('data-cond-spellid'),
				'counter': el.getAttribute('data-cond-counter'),

				'severity': el.getAttribute('data-severity'),
			});
		});
		console.log(encounter_events);


		// player spells / actions
		var actions = new Array();

		// get all player spells/actions
		$('#spellsarea .spellsarea-td DIV').each(function (i, el) {
			// console.log(el);
			// console.log(el.getElementsByTagName('code')[0]);

			// get the note from any <code> child of this element
			var note;
			if (el.getElementsByTagName('code')) {
				note = el.getElementsByTagName('code')[0].innerText;
				// remove outer quotes
				note = note.replace(/^"(.*)"$/, '$1');
			}
			// console.log(note);

			actions.push({
				'x': el.offsetLeft,
				'player': el.getAttribute('data-player'),
				'spellid': el.getAttribute('data-spellid'),
				'note': note,
			});
		});

		console.log(actions);


		// roster
		// Nothing extra to do here... see `roster` global object.

		// get the encounter name from the currently selected encounter from the dropdown.
		var encounter_name = $('#encounter-select').val() || '';

		var encounter_data = {
			'name': encounter_name,
			'events': encounter_events,
			'roster': roster,
			'actions': actions,
		}

		return encounter_data;

	} //gatherEncounterData()





	//######################################
	// load full encounter data: encounter events, roster, actions.
	function loadEncounter(encounter_name) {

		// if no encounter name specified, load the previously loaded one
		if (!encounter_name) encounter_name = last_encounter_name;

		// read encounter data from localstorage
		var key = storagekey_encounterprefix + encounter_name;
		var encounter_data_loaded = JSON.parse( localStorage.getItem(key) ) || {
			// empty encounter data
			'name': '(Untitled Encounter)',
			'roster': {},
			'events': {},
			'actions': {},
		};
		// console.log(encounter_data_loaded);

		// extract roster, events, and actions (into their globals)
		roster = encounter_data_loaded['roster'];
		encounter_events = encounter_data_loaded['events'];
		actions = encounter_data_loaded['actions'];


		/*
		// temporarily testing encounter_events override as Array.  REMOVE THIS WHEN DONE TESTING.
		encounter_events = new Array(
			// format: array of objects made up of: phase, time, duration, name, severity (1-5)
			// note: for time format use integer seconds. Not MM:SS format.  Convert to MM:SS for MRT note.
			// phase of "0" omits any phase specified in the generated MRT note.
			// severity is used for coloring the name of the event. (a scale of roughly yellow [least severe] through red [most severe]).
			// duration is only used in this interface, not in the MRT note.  Default is "1" (second).
			// key is an estimated time which could be an actual time from beginning of encounter, or a user-chosen time approximating when an SAA trigger occurs, for example.  In the latter case the position on the timeline is chosen by the user, can be modified, and has no effect in the MRT note.
			{'phase': 0, 'time': '8', 'duration': '1', 'name': 'Group soak', 'severity': 1},
			{'phase': 0, 'time': '13', 'duration': '1', 'name': 'Tank slam', 'severity': 5},
			{'phase': 0, 'time': '30', 'duration': '1', 'name': 'Stack', 'severity': 2},
			{'phase': 0, 'time': '36', 'duration': '1', 'name': 'Tank slam', 'severity': 3},
			{'phase': 0, 'time': '51', 'duration': '1', 'name': 'Group soak', 'severity': 1},
			{'phase': 0, 'time': '55', 'duration': '1', 'name': 'Tank slam', 'severity': 5},
			{'phase': 0, 'time': '71', 'duration': '1', 'name': 'Stack', 'severity': 1},
			{'phase': 0, 'time': '78', 'duration': '1', 'name': 'test Tank slam', 'severity': 3},
			{'phase': 0, 'time': '88', 'duration': '1', 'name': 'Run', 'severity': 0},

			{'phase': 0, 'time': '96', 'duration': '1', 'name': 'Stack', 'severity': 2},
			{'phase': 0, 'time': '105', 'duration': '1', 'name': 'Group soak', 'severity': 1},
			{'phase': 0, 'time': '110', 'duration': '1', 'name': 'Tank slam', 'severity': 5},
			{'phase': 0, 'time': '126', 'duration': '1', 'name': 'Stack', 'severity': 2},
			{'phase': 0, 'time': '133', 'duration': '1', 'name': 'Tank slam', 'severity': 3},
			{'phase': 0, 'time': '148', 'duration': '1', 'name': 'Group soak', 'severity': 1},
			{'phase': 0, 'time': '152', 'duration': '1', 'name': 'Tank slam', 'severity': 5},
			{'phase': 0, 'time': '168', 'duration': '1', 'name': 'Stack', 'severity': 1},
			{'phase': 0, 'time': '175', 'duration': '1', 'name': 'Tank slam', 'severity': 3},
			{'phase': 0, 'time': '185', 'duration': '1', 'name': 'Run', 'severity': 0},

			{'phase': 0, 'time': '193', 'duration': '1', 'name': 'Stack', 'severity': 1},
			{'phase': 0, 'time': '201', 'duration': '1', 'name': 'Group soak', 'severity': 1},
			{'phase': 0, 'time': '206', 'duration': '1', 'name': 'Tank slam', 'severity': 5},
			{'phase': 0, 'time': '222', 'duration': '1', 'name': 'Stack', 'severity': 2},
			{'phase': 0, 'time': '229', 'duration': '1', 'name': 'Tank slam', 'severity': 3},
			{'phase': 0, 'time': '244', 'duration': '1', 'name': 'Group soak', 'severity': 1},
			{'phase': 0, 'time': '248', 'duration': '1', 'name': 'Tank slam', 'severity': 5},
			{'phase': 0, 'time': '263', 'duration': '1', 'name': 'Stack', 'severity': 2},
			{'phase': 0, 'time': '271', 'duration': '1', 'name': 'Tank slam', 'severity': 3},
			{'phase': 0, 'time': '281', 'duration': '1', 'name': 'Run', 'severity': 0},
		); // var encounter_events
		*/


		/*
		roster = {
			"Teuin": {"class": "druid", "spec": "guardian"},
			"Ammardria": {"class": "druid", "spec": "feral"},
			"Elyrannah": {"class": "dk", "spec": "frost"},
			"Kiroker": {"class": "evoker", "spec": "pres"},
			"Ketyra": {"class": "evoker", "spec": "dev"},
			"Modat": {"class": "monk", "spec": "mw"},
			"Mythlixdyn": {"class": "monk", "spec": "bm"},
			"Mapleknuckls": {"class": "monk", "spec": "ww"},
			"Cowshins": {"class": "priest", "spec": "holy"},
			"Díscø": {"class": "priest", "spec": "disc"},
			"Pogó": {"class": "paladin", "spec": "ret"},
			"Ursicinus": {"class": "paladin", "spec": "ret"},
			"Fyrstorme": {"class": "paladin", "spec": "ret"},
			"Teefchief": {"class": "dh", "spec": "havoc"},
			"Courscyn": {"class": "hunter", "spec": "bm"},
			"Dathias": {"class": "hunter", "spec": "bm"},
			"Luckyjr": {"class": "mage", "spec": "frost"},
			"Player": {"class": "rogue", "spec": "ass"},
			"Oreskovich": {"class": "shaman", "spec": "resto"},
			"Bloodseer": {"class": "shaman", "spec": "enh"},
			"Zeratek": {"class": "warlock", "spec": "dest"},
			"Dimarco": {"class": "warrior", "spec": "arms"},
			"Hrøthgar": {"class": "warrior", "spec": "fury"},
		}; // var roster
		*/


		/*
		// TEMPORARILY OVERWRITE FOR TESTING
		actions = new Array(
			// note: for time format use integer seconds. Not MM:SS format.  Later converted to MM:SS for MRT note.
			{'phase': 1, 'time': '8', 'player': 'Oreskovich', 'spellid': 98008},
			{'phase': 1, 'time': '8', 'player': 'Kiroker', 'spellid': 370537},
			{'phase': 1, 'time': '8', 'player': 'Modat', 'spellid': 322118},
			{'phase': 1, 'time': '13', 'player': 'Díscø', 'spellid': 246287},
			{'phase': 1, 'time': '51', 'player': 'Dimarco', 'spellid': 97462},
		); // var actions
		*/


		// set the encounter dropdown's selected item to the encounter we're loading
		//
		// TO DO
		//


		// build a list of players by class, for quicker processing later
		init_roster_by_class();


		// display the loaded encounter events
		display_encounter_events();

		// display the loaded roster
		display_spells();

		// make spells/actions draggable
		is_dragging = false;
		make_spells_draggable();

		// make applicable events draggable (only those with conditions: SAA, SAR, SCS, or SCC)
		make_events_draggable();

		// setup player list for the 'remove player' dialog
		initPlayerDialogs();
		// setup player list for the 'custom action' dialog
		initCustomActionPlayers();

		// remember this as the last-used encounter
		last_encounter_name = encounter_name;
		localStorage.setItem(storagekey_lastencounter, last_encounter_name);

	} //loadEncounter()




	//######################################
	// build a list of players by class, for quicker processing later
	function init_roster_by_class() {

		// empty it
		roster_by_class = {};

		// for each player in roster
		for (var r in roster) {

			// add to an array of all players with that class
			if (typeof(roster_by_class[roster[r].class]) === 'undefined') {
				roster_by_class[roster[r].class] = new Array();
			}
			roster_by_class[roster[r].class].push(r);
		};

		// always include a blank class in the roster so class-agnostic spells work (health pot, etc.)
		roster_by_class[''] = Array('');

		// console.log(roster_by_class);

	} //init_roster_by_class()





	//######################################
	// prepares the 'remove players' dialog with the current roster
	// also prepares the 'rename players' dialog with the current roster
	function initPlayerDialogs() {

		var h_remove = '';
		var h_rename = '';

		// get alphabetically sorted list of player names as an array
		var names = Object.keys(roster).sort();

		// for each player in roster
		// for (var i in names) {
		for (var i=0; i < names.length; i++) {

			// create an html checkbox and add it to the html for the dialog
			h_remove = h_remove + '<label>' + (i + 1) + '. <input type="checkbox" name="remove-player-checkbox" value="' + names[i] + '">' + names[i] + '</label>';

			// rename dialog uses a dropdown
			h_rename = h_rename + '<option value="' + names[i] + '">' + names[i] + '</option>';
		};

		// plug the html into the dialogs
		document.getElementById('remove-player-list').innerHTML = h_remove;
		document.getElementById('rename-player-select').innerHTML = h_rename;

	} //initPlayerDialogs()





	//######################################
	// prepares the 'custom action' dialog with the current roster
	function initCustomActionPlayers() {

		var h = '';

		// get alphabetically sorted list of player names as an array
		var names = Object.keys(roster).sort();

		// for each player in roster
		// for (var i in names) {
		for (var i=0; i < names.length; i++) {

			// create an html checkbox and add it to the html for the dialog
			h = h + '<label>' + i + '. <input type="checkbox" name="custom-action-player-checkbox" value="' + names[i] + '">' + names[i] + '</label>';
		};

		// plug the html into the dialog
		document.getElementById('custom-action-player-list').innerHTML = h;

	} //initCustomActionPlayers()





	//######################################
	// run on submission of the 'remove players' dialog
	function removeSelectedPlayers() {

		// get players selected for removal
		var els = document.querySelectorAll('input[name="remove-player-checkbox"]:checked');
		var names = new Array();
		if (els) {
			for (var i = 0; i < els.length; i++) {
				console.log(els[i], els[i].value);
				names.push(els[i].value);
			}
		}
		console.log(names);
		removePlayer(names);

	} //removeSelectedPlayers()





	//######################################
	// run on submission of the 'rename players' dialog
	function renameSelectedPlayer() {

		// get selected player for renaming
		var oldname = document.getElementById('rename-player-select').value;

		// get the new name
		var newname = document.getElementById('rename-player-name').value;
		// remove invalid characters
		newname = newname.replaceAll(/[^\p{L}]+/ug, '');
		// ensure the first letter is uppercase and the rest is lowercase.
		newname = newname.charAt(0).toUpperCase() + newname.substring(1).toLowerCase();

		console.log(oldname, newname);

		// renamePlayer(oldname, newname);

	} //renameSelectedPlayer()





	//######################################
	// convert seconds to MM:SS format
	function convert_seconds_to_MMSS(s) {
		var mmss = new Date(s * 1000).toISOString().substring(14, 19);
		// if leading number is a zero, remove it. (e.g. "00:10", or "01:00")
		mmss = mmss.replace(/^0/,'');
		return mmss;
	} //convert_seconds_to_MMSS()



	//######################################
	// convert MM:SS to seconds format
	function convert_MMSS_to_seconds(mmss) {
		var a = mmss.split(':');
		var s = (Number(a[0]) * 60) + Number(a[1]);
		return s;
	} //convert_MMSS_to_seconds()




	//######################################
	function get_RGB_for_class(classname) {
		// console.log(classname, class_colors[classname]);
		return class_colors[classname];
	} //get_RGB_for_class()



	//######################################
	function get_unique_id() {

		var safety = 0;
		var id;

		do {
			// try one
			id = Math.random().toString(36).slice(2);

			// see if an object by this ID already exists in the doc
			if (document.getElementById(id)) continue;	// try again

			break;
		} while (safety < 100);	// surely it won't matter if we ever hit the 100th random *duplicate* ID and return it...

		return id;
	} //get_unique_id()




	//######################################
	function closeEventDialog() {
		// ignore any changes made and just close the dialog.
		document.getElementById('event-dialog').close();
	} //closeEventDialog()





	//######################################
	// add/event event on encounter timeline
	function editEvent(el) {

		// console.log(is_dragging);
		// console.log(el);

		// fill the dialog with any options already present on the encounter event
		var duration = el.getAttribute('data-duration') || '';
		var severity = el.getAttribute('data-severity') || '';
		var timeline = el.offsetLeft;	/* position(time in seconds) on the timeline; NOT the time after fulfilment of condition, if any */
		var eventid = el.getAttribute('id') || '';
		var cond = el.getAttribute('data-cond') || '';
		var spellid = el.getAttribute('data-cond-spellid') || '';
		var phase = el.getAttribute('data-cond-phase') || '';
		var counter = el.getAttribute('data-cond-counter') || '';
		var time = el.getAttribute('data-time') || '';	/* time from fulfillment of condition in mm:ss */
		// get event name from the innerhtml
		var eventname = el.innerHTML || '';
		// remove the <span> (time) portion from the innerHTML
		eventname = eventname.replaceAll(/<span[^>]*?>.*<\/span>/gi, '');
		// also remove any placeholder that might be there
		eventname = eventname.replaceAll('<!--eventname-->', '');

		console.log('Read:', {
			'eventid': eventid,
			'timeline': timeline,
			'duration': duration,
			'severity': severity,
			'cond': cond,
			'spellid': spellid,
			'phase': phase,
			'counter': counter,
			'time': time,
			'eventname': eventname,
		});

		// fill details then show dialog for adding/editing this event
		document.getElementById('ed-event-id').value = eventid;
		document.getElementById('edname').value = eventname;
		document.getElementById('edtime').value = time;
		// phase number, if applicable
		document.getElementById('edcond_phase_counter').value = phase;
		// timeline value
		document.getElementById('ed-timeline').value = timeline;


		// condition
		// first uncheck all the radio buttons
		var radiobuttons;
		radiobuttons = document.querySelectorAll('input[name="edcond"]');
		for (var i = 0; i < radiobuttons.length; i++) {
			radiobuttons[i].checked = false;
		}
		// check the proper radio button given the condition (cond)
		switch(cond) {
			case '':
			case 'start':
				radio = 'edcond_start';
				break;
			case 'phase':
				radio = 'edcond_' + cond;
				break;
			default:
				radio = 'edcond_' + cond;
				// occurrence/counter if applicable
				document.getElementById(radio + '_counter').value = counter;
				// spellid if applicable
				document.getElementById(radio + '_spellid').value = spellid;
				break;
		}
		console.log(cond, radio);
		document.getElementById(radio).checked = true;


		// severity
		// first uncheck all the radio buttons
		radiobuttons = document.querySelectorAll('input[name="edseverity"]');
		for (var i = 0; i < radiobuttons.length; i++) {
			radiobuttons[i].checked = false;
		}
		// check the proper radio button given the severity
		var radio = 'edseverity0';	// default to start of encounter unless specified
		if (severity > '') {
			radio = 'edseverity' + severity;
			// console.log(radio);
		}
		document.getElementById(radio).checked = true;


		// show the dialog
		document.getElementById('event-dialog').showModal();

		// update the MRT line preview
		update_event_dialog_preview();

		return false;
	} //editEvent()




	//######################################
	function saveEvent() {
		// gets details from the open event dialog and writes it to the applicable encounter event


		// TO DO: ENSURE THIS REMOVES ANY INAPPLICABLE ATTRIBUTES FROM THE LAST TIME THE EVENT WAS EDITED!  Either null ALL the attributes while setting their values, or remove ones not applicable.


		// event id
		var eventid = document.getElementById('ed-event-id').value || '';

		// the element we're updating...
		var el = document.getElementById(eventid);
		console.log(el);
		if (!el) return;

		// event name
		var eventname = document.getElementById('edname').value || '';

		// event condition
		var cond = document.querySelector('input[name="edcond"]:checked').value || '';
		// if condition is 'start', ignore its sub values
		if (cond == 'start') cond = '';

		// conditional phase, if any
		var phase = document.getElementById('edcond_phase_counter').value || '';

		// event time
		var time = document.getElementById('edtime').value || '';

		// severity
		var severity = document.querySelector('input[name="edseverity"]:checked').value || '';

		// conditional auraid / spellid / phase, if any
		var subid = '';
		var counterid = '';
		var spellid = '';
		var counter = '';
		var add_draggable = false;

		switch(cond) {
			case '':
			case 'start':
				cond = '';
				// for 'start'-conditional events, the position on the timeline is based on the value of `time`.  Calculate the new x-position for this event based on `time`, and move it there.
				// first convert mmss to whole seconds
				if (time > '') {
					var seconds = convert_MMSS_to_seconds(time);
					var new_x = Number(seconds * events_column_width_num);
					// console.log(seconds, new_x);
					el.style.left = new_x + 'px';
					// also move the event's shadow bar
					document.getElementById('shadow-for-' + el.id).style.left = (new_x + player_column_width_num) + 'px';
				}
				break;

			case 'phase':
				// subid = 'edcond_phase_counter';
				// (see `phase` variable, gotten above)

				add_draggable = true;
				break;

			default:
				subid = 'edcond_' + cond + '_spellid';
				counterid = 'edcond_' + cond + '_counter';
				add_draggable = true;
				break;

		} //switch(cond)

		if (subid > '') spellid = document.getElementById(subid).value || '';
		if (counterid > '') counter = document.getElementById(counterid).value || '';


		// use condition in display name
		var displayname = get_event_condition_display(eventname, cond, time, spellid, counter, phase);

		// set the display name
		el.innerHTML = displayname;

		// set the rest of the data-* values
		el.setAttribute('data-cond', cond);
		el.setAttribute('data-time', time);	/* time from fulfillment of condition in mm:ss */
		el.setAttribute('data-cond-spellid', spellid);
		el.setAttribute('data-cond-phase', phase);
		el.setAttribute('data-cond-counter', counter);
		el.setAttribute('data-severity', severity);
		//
		// TO DO:
		//	duration
		var duration = '';


		// if the event has any text, change the class so its :hover cursor is a pointer. (the default is the "+" cursor when there is no event at this spot in the timeline)
		if (eventname > '') {
			el.classList.add('edit');
		} else {
			el.classList.remove('edit');
		}

		// in case this event has become draggable, ensure it is so.
		if (add_draggable > '') {
			el.classList.add('draggable-event');
		} else {
			el.classList.remove('draggable-event');
		}

		make_events_draggable();


		console.log('Saved:', {
			'eventid': eventid,
			// 'timeline': timeline,
			'duration': duration,
			'severity': severity,
			'cond': cond,
			'spellid': spellid,
			'phase': phase,
			'counter': counter,
			'time': time,
			'eventname': eventname,
		});

		// close the dialog
		closeEventDialog();

		// save the changes
		saveEncounter();

	} //saveEvent()





	//######################################
	// given an encounter event's: condition, time (mmss), spellid and/or phase, return how it should display on the events timeline.
	function get_event_condition_display(eventname, cond, mmss, spellid, counter, phase) {

		var displayname = '';
		var timeprefix = '';	/* for Phase/SAA/SAR/SCS/SCC events, time is relative to the trigger, so prefix with "+". */

		// use condition in display name

		// shorten the conditional if needed
		var displaycond = '';
		var condsuffix = '';	/* For phase, the number/name.  For SAA/SAR/SCS/SCC, the spellid. */
		var add_draggable = '';

		switch (cond) {
			case '':
			case 'start':
				cond = '';	// no need to store this as "start". Just make it empty.
				displaycond = '';
				mmss = '';	// timeline already contains all seconds from beginning of encounter.  Leave mmss null here.
				break;
			case 'phase':
				displaycond = 'P' + phase;
				add_draggable = 'draggable-event';
				condsuffix = '';
				timeprefix = "+ ";
				break;
			case 'saa':
			case 'sar':
			case 'scs':
			case 'scc':
				displaycond = cond.toUpperCase() + condsuffix;
				add_draggable = 'draggable-event';
				condsuffix = ':' + spellid;
				timeprefix = "+ ";
			default:
				break;
		}

		if (cond > '') {
			// add occurrence/counter if any
			if (counter > '') displaycond += '(' + counter + ')';

			displayname += '<span class="event_cond">'+ displaycond +'</span>';
		}

		// use time in display name
		if (mmss > '') {
			displayname += '<span class="event_mmss">'+ timeprefix + mmss +'</span>';
		}
		// suffix with name
		displayname += eventname;

		return displayname;

	} //get_event_condition_display()





	//######################################
	// delete the event in the currently opened event dialog
	function deleteEvent() {

		// get the event id
		var id = document.getElementById('ed-event-id').value;

		// if an event by that id exists...
		if (document.getElementById(id)) {

			// delete it and any child elements
			$('#' + id).remove();

			// close the event dialog
			closeEventDialog();

			// save the changes
			saveEncounter();
		}
	} //deleteEvent()





	//######################################
	// update the MRT note line preview for the encounter event we're editing
	function update_event_dialog_preview() {

		var note = '';

		var name = document.getElementById('edname').value || '';
		var time = document.getElementById('edtime').value || '';

		// does time always need to start with a number not ":"?  Let's do it anyways
		if (Array.from(time)[0] == ':') time = '0' + time;


		var cond = document.querySelector('input[name="edcond"]:checked').value || '';
		// prepare uppercase version of condition in case MRT needs that
		var condU = cond.toUpperCase();

		// if condition radio button has a subfield for an aura id or spell id [and occurrence/counter], get their value(s)
		// if condition is 'start', treat it as if it's null.
		if (cond == 'start') cond = '';

		var subid = '';
		var subval = '';
		var counterid = '';

		switch (cond) {
			case '':
			// case 'start':
				break;
			case 'phase':
				subid = 'edcond_phase_counter';
				break;
			default:
				// otherwise it's one of: saa, sar, scs, scc
				subid = 'edcond_' + cond + '_spellid';
				counterid = 'edcond_' + cond + '_counter';
				break;
		}

		if (subid > '') {
			var subval = document.getElementById(subid).value || '';
		}
		if (counterid > '') {
			var counter = document.getElementById(counterid).value || '';
		}
		// console.log('subval = '+ subval);
		// console.log('counterid = '+ counterid);



		// format example: (this preview doesn't consider any player spells -- only encounter events)
		// {time:TIME,SCC/SCS/SAA/SAR:SPELL_ID:SPELL_COUNT:SOURCE_NAME:PHASE}
		//
		//	TO DO: SOURCE_NAME & PHASE
		//
		switch (cond) {
			case '':
				note = '{time:'+ time +'}'+ name;
				break;
			case 'phase':
				note = '{time:'+ time +',p'+ subval +'}'+ name;
				break;
			case 'saa':
			case 'sar':
			case 'scs':
			case 'scc':
				if (counter > '') counter = ':' + counter;
				note = '{time:'+ time +','+ condU +':'+ subval + counter +'}'+ name;
				break;
		}

		document.getElementById('edpreview').innerHTML = note;

	} //update_event_dialog_preview()

	// set up listeners for the event editing dialog

	// onchange of fields (to update the mrt note line preview)
	$('#event-dialog INPUT').on('keyup', function() {
		update_event_dialog_preview();
	});
	$('#event-dialog INPUT').on('change', function() {
		update_event_dialog_preview();
	});







	//######################################
	// set up a new, empty encounter
	function newEncounter() {

		closeAllMenus();

		// loop attempts to create a new, unique encounter name
		var done = false;
		var newname = 'Name';
		do {
			// prompt for a name
			newname = prompt('Encounter name', newname);

			if (newname) {
				// see if an encounter by this name already exists
				if (saved_encounters.indexOf(newname) !== -1) {
					done = false;
					alert('An encounter by that name already exists.');
				} else {
					done = true;
				}
			} else {
				// cancelled.  Exit the loop.
				done = true;
			}

		} while (!done);

		// if the dialog above wasn't cancelled, proceed
		console.log('new encounter: "'+ newname +'"')
		if (newname) {

			console.log('Emptying encounter and creating new one named "'+ newname +'".');

			// clear encounter events
			// $('#encounter-events-wrapper').empty();
			document.getElementById('encounter-events-wrapper').replaceChildren();

			// clear players and spells areas
			// $('#spellsarea').empty();
			document.getElementById('spellsarea').replaceChildren();

			var roster = {};
			var encounter_events = {};
			var actions = {};

			// save this encounter under the new name
			saveEncounter(newname);

			// re-populate the list of saved encounters to include the new one
			populateEncounterList(newname);

			// switch to this duplicate (is this the preferred action?)
			loadEncounter(newname);

		}

	} //newEncounter()







	//######################################
	// rename current encounter, first prompting for its new name
	function renameEncounter() {

		closeAllMenus();

		var oldname = $('#encounter-select').val();

		// loop attempts to get a new, unique encounter name
		var done = false;
		var newname = oldname;
		do {
			// prompt for a name
			newname = prompt('Rename encounter to:', newname);

			if (newname) {
				// see if an encounter by this name already exists
				if (saved_encounters.indexOf(newname) !== -1) {
					done = false;
					alert('An encounter by that name already exists.');
				} else {
					done = true;
				}
			} else {
				// cancelled.  Exit the loop.
				done = true;
			}

		} while (!done);

		// if the dialog above wasn't cancelled, proceed
		if (newname) {
			console.log('Renaming encounter from "' + oldname + '" to "' + newname + '"')

			// remove from list of saved encounters --  the global and local storage
			console.log(saved_encounters);
			var i = saved_encounters.indexOf(oldname);
			saved_encounters.splice(i, 1);
			console.log(saved_encounters);

			// update saved list of encounter names
			localStorage.setItem( storagekey_savedencounters, JSON.stringify(saved_encounters) );

			// save this encounter under the new name
			saveEncounter(newname);

			// re-populate the list of saved encounters to include the new one
			populateEncounterList(newname);

			// switch to this duplicate (is this the preferred action?)
			loadEncounter(newname);
		}

	} //renameEncounter()







	//######################################
	// delete the currently selected encounter
	function deleteEncounter() {

		closeAllMenus();

		// get encounter name
		var encounter_name = $('#encounter-select').val();

		// confirm
		if (window.confirm('Delete the encounter?\n' + encounter_name)) {

			// remove from list of saved encounters --  the global and local storage
			console.log(saved_encounters);
			var i = saved_encounters.indexOf(encounter_name);
			saved_encounters.splice(i, 1);
			console.log(saved_encounters);

			// update saved list of encounter names
			localStorage.setItem( storagekey_savedencounters, JSON.stringify(saved_encounters) );

			// remove the encounter data
			localStorage.removeItem(storagekey_encounterprefix + encounter_name);

			// re-populate the list of saved encounters to exclude the deleted one
			last_encounter_name = null;
			populateEncounterList();

			// empty the events
			document.getElementById('encounter-events-wrapper').replaceChildren();

			// empty the spellsarea
			document.getElementById('spellsarea').replaceChildren();

		}

	} //deleteEncounter()





	//######################################
	// replicate the encounter under an automatic name (that the user can rename after)
	function copyEncounter() {

		closeAllMenus();

		// var newname = $('#encounter-select').val() || '';
		// newname += ' ' + new Date().toLocaleDateString('en-CA', {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false, minute: '2-digit', second: '2-digit'});
		// prompt for new name
		var newname = prompt('Name for this duplicate', 'Name');

		if (newname) {
			// see if an encounter by this name already exists
			if (saved_encounters.indexOf(newname) !== -1) {

				var go = confirm('An encounter by that name already exists. Overwrite?')

				// if Cancel hit, abort.
				if (!go) return;

				// proceed below to copy the counter to the newname...
			}
		}
		console.log('Creating a copy of this encounter under the name "' + newname + '"');

		// save this encounter under the new name
		saveEncounter(newname);

		// re-populate the list of saved encounters to include the new one
		populateEncounterList(newname);

		// switch to this duplicate (is this the preferred action?)
		loadEncounter(newname);

		// remember this as the last-used encounter
		last_encounter_name = newname;
		localStorage.setItem(storagekey_lastencounter, last_encounter_name);

	} //copyEncounter()





	//######################################
	// serialize the encounter data and offer it as a downloadable file
	function exportEncounter() {

		closeAllMenus();

		var encounter_data = gatherEncounterData();
		var json = JSON.stringify(encounter_data);

		// for filename to suggest saving as, take encounter name and clean it to remove troublesome characters
		var encounter_name = $('#encounter-select').val();
		var fn = encounter_name.replaceAll(/[:&'@{}[\],$=!#().%+~\/ ]/gi, '_') + '.txt';
		console.log(encounter_name, fn);

		var a = document.createElement('a');
		a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(json));
		a.setAttribute('download', fn);
		a.click();

	} //exportEncounter();





	//######################################
	function importEncounterDialog() {

		closeAllMenus();

		// show the dialog
		document.getElementById('import-encounter-dialog').showModal();

	} //importEncounterDialog()





	//######################################
	// pass in encounter data in json format (txt) and load this encounter
	function importEncounter(txt) {

		// var txt = document.getElementById('import-text').innerText;

		console.log(txt);
		var encounter_data;

		try {
			encounter_data = JSON.parse(txt);
		} catch (e) {
			alert("Not a valid input file.");
			return console.error(e);
		}

		// save it to our list of encounters
		var key = storagekey_encounterprefix + encounter_data['name'];

		// NOTE: this will overwrite any existing encounter by the same name
		localStorage.setItem(key, JSON.stringify(encounter_data));

		// add encounter name to list of saved encounters
		addToSavedEncounters( encounter_data['name'] );

		// load this as the current encounter
		loadEncounter(encounter_data['name']);

		// close the import dialog
		closeImportDialog();

	} //importEncounter()





	//######################################
	// setup listener uploading import encounter file
	// if a file is selected, immediately read it and paste its contents into the textarea.
	document.getElementById('import-encounter-file').addEventListener('change', function(e) {

		// console.log('change', e);
		// console.log(e.target.files[0]);

		var file = e.target.files[0];

		// fill import textarea with the contents of the file
		const reader = new FileReader();
		reader.readAsText(file);

		reader.onload = function() {
			// fill the textarea with the import file contents
			document.getElementById('import-encounter-text').innerText = reader.result;
		}

		reader.onerror = function() {
			console.log(reader.error);
			alert('Unable to read import file.');
		}
	});





	//######################################
	// setup listener uploading import roster file
	// if a file is selected, immediately read it and paste its contents into the textarea.
	document.getElementById('import-roster-file').addEventListener('change', function(e) {

		// console.log('change', e);
		// console.log(e.target.files[0]);

		var file = e.target.files[0];

		// fill import textarea with the contents of the file
		const reader = new FileReader();
		reader.readAsText(file);

		reader.onload = function() {
			// fill the textarea with the import file contents
			document.getElementById('import-roster-text').innerText = reader.result;
		}

		reader.onerror = function() {
			console.log(reader.error);
			alert('Unable to read import file.');
		}
	});





	//######################################
	function closeImportDialog() {
		document.getElementById('import-encounter-dialog').close();
	} //closeImportDialog()





	//######################################
	function closeImportRosterDialog() {
		document.getElementById('import-roster-dialog').close();
	} //closeImportRosterDialog()





	//######################################
	function importRosterDialog() {

		closeAllMenus();

		// show the dialog
		document.getElementById('import-roster-dialog').showModal();

	} //importRosterDialog()





	//######################################
	// clicked [add custom action] on the Custom Action dialog
	function saveCustomAction() {

		// get the new action text
		var note = document.getElementById('custom-action-note').value;

		if (note > '') {

			// get checked players
			var els = document.querySelectorAll('input[name="custom-action-player-checkbox"]:checked');

			// var players = new Array();

			var players = '';
			var join = '';
			if (els) {
				for (var i = 0; i < els.length; i++) {

					// console.log(els[i], els[i].value);
					// players.push(els[i].value);

					players += join + els[i].value;
					if (join == '') join = ', ';
				}
			}
			// console.log(players, players);

			var parent_el = tr_custom_actions;
			var spellid = null, spellname = '', spellclass = '';

			// the column is the timeline position they clicked when adding a custom event.
			var col = document.getElementById('custom-action-col').value;
			console.log('pass to addCDtoTimeline:', parent_el, players, col, note);

			// add this action to the #spellsarea
			addCDtoTimeline(parent_el, spellid, spellname, spellclass, players, col, note);

			// save the changes
			saveEncounter();
		}

	} //saveCustomAction()





	//######################################
	// ask for player name
	// DEPRECATED.. see submitAddPlayer()
	function promptForPlayerName() {

		var newname = prompt('Enter player name', 'Name');
		console.log(newname);
		if (newname) {
			// get the value of the class-spec selection
			var class_spec = document.getElementById('add-player-select').value;
			// split class-spec into class and spec
			class_spec = class_spec.split('-');
			var classname = document.getElementById('add-player-select').value;
			addPlayer(newname, class_spec[0], class_spec[1] || '');
		}

	} //promptForPlayerName()





	//######################################
	function showAddPlayerDialog() {

		// close any open menus
		closeAllMenus();

		// show the dialog
		document.getElementById('add-player-dialog').showModal();

	} //showAddPlayerDialog()




	//######################################
	function closeAddPlayerDialog() {
		document.getElementById('add-player-dialog').close();
	} //closeAddPlayerDialog()





	//######################################
	function closeRemovePlayerDialog() {
		document.getElementById('remove-player-dialog').close();
	} //closeRemovePlayerDialog()





	//######################################
	function closeRenamePlayerDialog() {
		document.getElementById('rename-player-dialog').close();
	} //closeRenamePlayerDialog()





	//######################################
	function closeCustomActionDialog() {
		document.getElementById('custom-action-dialog').close();
	} //closeCustomActionDialog()





	//######################################
	// clicked [add player] on the Add Player dialog
	function submitAddPlayer() {

		// get the new player name
		var newname = document.getElementById('add-player-name').value;
		// get the value of the class-spec selection
		var class_spec = document.getElementById('add-player-select').value;
		// split class-spec into class and spec
		class_spec = class_spec.split('-');
		var classname = document.getElementById('add-player-select').value;

		if (newname > '') {
			addPlayer(newname, class_spec[0], class_spec[1] || '');
		}

	} //submitAddPlayer()





	//######################################
	function addPlayer(name, classname, spec) {

		// ensure the first letter is uppercase and the rest is lowercase.
		name = name.charAt(0).toUpperCase() + name.substring(1).toLowerCase();

		// if a player by this name already exists, abort
		if (roster[name]) {
			console.log('A player named '+ name +' already exists.  Abort.')
			alert('A player named '+ name + ' already exists.');
			return;
		}

		// add this player to the roster
		roster[name] = {
			'class': classname,
			'spec': spec,
		}

		// update the roster_by_class list
		init_roster_by_class();

		// save the encounter
		saveEncounter();

		// re-load the encounter to include the newly added player
		loadEncounter();

	} //addPlayer()





	//######################################
	function showRemovePlayerDialog() {

		// close any open menus
		closeAllMenus();

		// show the dialog
		document.getElementById('remove-player-dialog').showModal();

	} //showRemovePlayerDialog()




	//######################################
	// pass either a player name (string) or an array of player names (strings) to be removed.
	function removePlayer(name) {

		// see if it's a single name or array of names
		if (Array.isArray(name)) {
			// it's an array of names.  For each name, delete it from the roster.
			for (var i = 0; i < name.length; i++) {
				delete roster[name[i]];
				console.log('Removed player '+ name[i]);
			}
		} else {
			// it's a single name
			delete roster[name];
			console.log('Removed player '+ name);
		}


		// update the roster_by_class list
		init_roster_by_class();

		// save the encounter
		saveEncounter();

		// re-load the encounter to exclude the removed player
		loadEncounter();

	} //removePlayer()





	//######################################
	function showRenamePlayerDialog() {

		// close any open menus
		closeAllMenus();

		// show the dialog
		document.getElementById('rename-player-dialog').showModal();

	} //showRenamePlayerDialog()





	//######################################
	function exportRoster() {

		var json = JSON.stringify(roster);

		// suggest a filename using the first letter of all players.  It's not perfect but just a suggestion.
		var names = Object.keys(roster).sort();
		var letters = names.map((name) => name.charAt(0)).join('');

		var fn = 'roster-' + letters + '.txt';
		console.log(fn, names);

		var a = document.createElement('a');
		a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(json));
		a.setAttribute('download', fn);
		a.click();

	} //exportRoster()





	//######################################
	function importRoster(txt) {

		console.log(txt);

		try {
			roster = JSON.parse(txt);
		} catch (e) {
			alert("Not a valid input file.");
			return console.error(e);
		}

		// update the roster_by_class list
		init_roster_by_class();

		// save the encounter
		saveEncounter();

		// re-load the encounter to include the newly added player
		loadEncounter();

	} //importRoster()





	//######################################
	function removeAllPlayers() {

		// empty the roster
		roster = {};

		// update the roster_by_class list
		init_roster_by_class();

		// save the encounter
		saveEncounter();

		// re-load the encounter to include the newly added player
		loadEncounter();
	}





	//######################################
	function escape_html(html) {

		return html.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

	} //escape_html()





	//######################################
	function closeAllMenus() {

		// any spell action menu
		$('#cdmenu').hide();

		closeAddPlayerDialog();
		closeRemovePlayerDialog();
		closeEventDialog();
		closeImportDialog();
		closeImportRosterDialog();

		// close any spell choice dropdown(s)
		$('.spellchoice-menu').hide();
		$('.spellchoice.opened').removeClass('opened');

		is_menu_up = false;

	} //closeAllMenus()





	//######################################
	// clicked the fake dropdown for mutually exclusive player spells.
	// show the dropdown for spell options.  Or if the dropdown is already open, close it.
	function click_spellchoice(e) {

		// ensure click doesn't go through to underlying elements, e.g. #spellsarea.
		e.stopPropagation();

		// get the parent div which contains the info we need
		var el = e.target.closest('.players-col > DIV');

		// get id of dropdown from element passed in
		var id = el.id;
		var dd_id = id.replace('selected-', 'spellchoice-');
		var dd_el = document.getElementById(dd_id);

		// close any [other] opened menus
		// closeAllMenus();

		// if dropdown is already visible, close it.
		// console.log(isVisible(dd_el));
		if ( $(dd_el).is(':visible') ) {
			// close it
			el.classList.remove('opened');
			// dd_el.style.display = 'none';
			$(dd_el).hide();
		} else {
			// open it (unhide it)

			// close any [other] opened menus
			closeAllMenus();

			// add class so it appears to be an opened dropdown
			el.classList.add('opened');
			// dd_el.style.display = 'block';
			$(dd_el).show();
		}

	} //click_spellchoice()





	//######################################
	// clicked an item in the dropdown for mutually exclusive player spells
	// change the main element to reflect the selected spell and close the dropdown
	function click_spellchoice_menu_item(el, parent_id) {

		// get the parent div whose info we'll be changing
		console.log(el);
		console.log(parent_id);
		var parent_el = document.getElementById(parent_id);
		console.log(parent_el);

		// get details we need from the clicked element
		var mmss = el.getAttribute('data-duration');
		var player = el.getAttribute('data-player');
		var spellname = el.getAttribute('data-spellname');
		var spellid_new = el.getAttribute('data-spellid');
		parent_el.setAttribute('data-spellid', spellid_new);
		parent_el.setAttribute('data-duration', mmss);
		parent_el.setAttribute('data-spellname', spellname);

		// update spell name to reflect the newly selected spell
		// spell name template
		var htm = `<small>{player}<samp>{cooldown}</samp></small>{spellname}`;

		htm = htm.replaceAll('{spellname}', spellname);
		htm = htm.replaceAll('{cooldown}', mmss);
		htm = htm.replaceAll('{player}', player);

		parent_el.innerHTML = htm;

		// close this and any other open menu
		closeAllMenus();


		// if this spell exists on the timeline, update it to reflect the spell change.
		// the id of the TD containing any uses of this players' spell is the same as the parent_id passed in, but swap "selected-" with "usage-"
		var usage_id = parent_id.replace('selected-', 'usage-');
		var usage_el = document.getElementById(usage_id);
		console.log(usage_id, usage_el);

		// if there are any DIVs in this usage_el, update them to be the selected spell.
		var usage_els = document.querySelectorAll('#' + usage_id + ' > DIV');

		console.log(usage_els.length, usage_els);

		usage_els.forEach(function(uel, i) {
			console.log(uel);

			// get the key info from the element
			// and pass that info to create a new one in its place using the new spell

			var uid = uel.id;
			// remove the "cd-" from the front of the uid
			uid = uid.replace(/^cd-/,'');
			console.log(uid);

			var x = uel.offsetLeft;
			// get column given x-coordinate
			var col = Math.round(x / events_column_width_num);

			// var spellid = uel.getAttribute('data-spellid');	// NOTE: we don't want the *old* spellid.
			var player = uel.getAttribute('data-player');
			console.log(player, spellid_new, col);

			var note;
			if (uel.getElementsByTagName('code')) {
				note = uel.getElementsByTagName('code')[0].innerText;
				// remove outer quotes
				note = note.replace(/^"(.*)"$/, '$1');
			}
			console.log('Note is: ' + note + '.');

			// remove the old spell from the timeline
			console.log("Removing element: " + uid);
			removeCD(uid);

			// add the new one in its place

			console.log('add:', x, col, player, spellid_new, note);

			var cd_htm = get_cd_htm(spellid_new, player, col, note);

			// add the html to this cell
			$('#' + usage_id).append( $(cd_htm) );

			// ensure this action is now draggable
			make_spells_draggable();

		});

		// save the encounter so the spell change gets recorded
		saveEncounter();

	} //click_spellchoice_menu_item()





	//######################################
	// given spellid and player name, return the html used in the mutually exclusive spells dropdown.
	function get_htm_for_multispell_li(spellid, player) {

		// create the <li> html
		var htm = roster_template_multispell_option;

		// prepare the mm:ss and shortenable prefix for the spell cooldown
		mmss = convert_seconds_to_MMSS(spells[spellid].cooldown);
		if (spells[spellid].shortenable) {
			mmss = '~' + mmss;
		}

		htm = htm.replaceAll('{ew-spellid}', spellid);
		htm = htm.replaceAll('{ew-spellname}', spells[spellid].name);
		htm = htm.replaceAll('{player}', player);
		htm = htm.replaceAll('{ew-cooldown}', mmss);

		return htm;

	} //get_htm_for_multispell_li()





	//######################################
	// hide or show (toggle based on current state) all rows of a given spelltype. (rows identified by that spelltype classname)
	function toggle_spelltypes(spelltype) {

		closeAllMenus();
		// close any open menus, especially spellchoice

		// console.log('Toggling all rows of type: '+ spelltype);
		document.querySelectorAll('TR.' + spelltype).forEach(function(el, i) {
			el.classList.toggle('collapsed');
		});

		// toggle the heading expanded/collapsed (remove ".expanded")
		document.querySelector('DIV[data-spelltype='+ spelltype +']').classList.toggle('expanded');

	} //toggle_spelltypes()





	//######################################
	// is the element visible
	function isVisible(el) {
		return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
	}





	//######################################
	// unescape html entities
	function unescape_html(html) {
		var domdoc = new DOMParser().parseFromString(html, 'text/html');
		return domdoc.documentElement.textContent;
	}





	//######################################
	// if the translation exists, return it.  Otherwise, return the original english.
	function xlate(eng) {

		// if no alternate language file loaded, just return english string.
		if (typeof(translations) === 'undefined') return eng;

		// if a translation for this string exists, return it.  Otherwise return english string.
		return translations[eng] || eng;

	} //xlate()





	//######################################
	// toggle encounter events' draggability
	function toggleEncounterEventsLock() {

		var el_button = document.getElementById('encounter-events-lock');
		var el_timeline = document.getElementById('encounter-events-wrapper');

		// if they're currently locked, make them draggable.  Or vice versa.
		if (el_button.classList.contains('unlocked')) {
			// lock them
			el_button.classList.remove('unlocked');
			el_timeline.classList.remove('unlocked');

			// all ".timeline-event" elements get draggable-event removed
			var els = document.querySelectorAll('.timeline-event[data-cond=""]');	/* where data-cond is NOT one of: phase,saa,sar,scs,scc */
			if (els) {
				for (var i = 0; i < els.length; i++) {
					// console.log(els[i]);
					els[i].classList.remove('draggable-event');
					$(els[i]).draggable({
						disabled: true
					});
				}
			}

		} else {
			// make them draggable
			el_button.classList.add('unlocked');
			el_timeline.classList.add('unlocked');

			// all ".timeline-event" elements get draggable-event added
			var els = document.querySelectorAll('.timeline-event');
			if (els) {
				for (var i = 0; i < els.length; i++) {
					// console.log(els[i]);
					els[i].classList.add('draggable-event');
				}
				make_events_draggable();
			}
		}

	} //toggleEncounterEventsLock()





	//######################################
	// draws visual connectors between SAA/SAR/etc. events to illustrate they'll move as a unit.
	function draw_event_connectors() {

		// 20240822: not locking flexible events at the moment, so do nothing.
		return;

		// remove any previously existing connectors.
		var els = document.querySelectorAll('#encounter-events-wrapper ASIDE.connector').forEach(function(el, i) {
			el.remove();
		});


		// loop over all events.
		// if an event is one of SAA/SAR/etc., remember it.
		// when the next SAA/SAR/etc event is found, draw a line between those two. Then remember this event as the start of any subsequent line.
		// continue for all events.

		var els = document.querySelectorAll('.timeline-event[data-cond]:not([data-cond=""])');	/* where data-cond is NOT empty.  i.e. it's one of: phase,saa,sar,scs,scc */

		var last_x = null;
		var x, w;
		var h = '';

		if (els) {
			for (var i = 0; i < els.length; i++) {

				// console.log(els[i]);

				// get horizontal coordinates of this event
				x = els[i].offsetLeft;

				if (last_x !== null) {
					// draw a line between first event (at last_x) and this one

					// width is distance between last event and this one
					w = x - last_x + events_column_width_num;

					h = '<aside class="connector" style="left: '+ last_x +'px; width: '+ w +'px;"></aside>';
					$('#encounter-events-wrapper').append($(h));
				}

				// remember this event's position for the next pass
				last_x = x;
			}
		}

	} //draw_event_connectors()
















	// prevent context menu since we want right-click for other uses
	// window.addEventListener('contextmenu', (e) => e.preventDefault());


	// make mousewheel over timeline scroll horizontally
	document.getElementById('encounter-events').addEventListener('wheel', e => {
		document.getElementById('encounter-events').scrollLeft += e.deltaY;
	});


	// setup listener for encounter selection dropdown
	document.getElementById('encounter-select').addEventListener('change', e => {

		closeAllMenus();

		// get the selected encounter
		var encounter_name = e.target.value;

		// load the selected encounter
		loadEncounter(encounter_name);

		return true;
	})





	// turn certain ULs into jquery-ui menus
	$('.menu-options UL').menu();

	// close menu(s) when clicking outside of them
	document.querySelectorAll('.menu-backdrop').forEach(el => {
		el.addEventListener('click', e => {

			closeAllMenus();

			// don't let clicks register through this element
			e.preventDefault();
		})
	});

	// hitting Escape will close any open menus
	document.addEventListener('keyup', function(e) {
		if (e.keyCode == 27) {
			closeAllMenus();
		}
	});





	// setup automatic scroll syncing between events timeline and spells timeline
	document.getElementById('encounter-events').addEventListener('scroll', e => {
		// set the players/spells timeline to match this scroll bar position
		document.getElementById('spellsarea-wrapper').scrollLeft = e.target.scrollLeft;
	});
	document.getElementById('spellsarea-wrapper').addEventListener('scroll', e => {
		// set the encounter timeline to match this scroll bar position
		document.getElementById('encounter-events').scrollLeft = e.target.scrollLeft;
	});





	// buttonize the MRTnote overlay's [close] button
	$('#mrtnote-close').button().click(function(e){
		$('#mrtnote-overlay').hide();
	});











	// load the last-used encounter.
	// these globals will store the active encounter data, updated with every save.
	var roster = {};
	var encounter_events = {};
	var actions = {};

	var last_encounter_name = localStorage.getItem(storagekey_lastencounter);
	if (last_encounter_name) {
		var key = storagekey_encounterprefix + last_encounter_name;
		// var encounter_data_loaded = JSON.parse( localStorage.getItem(key) );

		// load the encounter, which sets globals: roster, encounter_events, actions
		loadEncounter(last_encounter_name);

	} else {
		// no previous encounter stored.  Create a new one.
		last_encounter_name = '(untitled encounter)';
		var key = storagekey_encounterprefix + last_encounter_name;
		localStorage.setItem(key, last_encounter_name);

		// create a dummy encounter so the interface should be a bit more intuitive to use.
		encounter_events = new Array(
			{'phase': '', 'position': 8, 'time': '0:08', 'name': 'Group soak', 'severity': 1},
			{'phase': '', 'position': 13, 'time': '0:13', 'name': 'Tank slam', 'severity': 5},
			{'phase': '', 'position': 30, 'time': '0:30', 'name': 'Stack', 'severity': 2},
			{'phase': '', 'position': 36, 'time': '0:36', 'name': 'Tank slam', 'severity': 3},
			{'phase': '', 'position': 51, 'time': '0:51', 'name': 'Group soak', 'severity': 1},
			{'phase': '', 'position': 55, 'time': '0:55', 'name': 'Tank slam', 'severity': 5},
			{'phase': '', 'position': 71, 'time': '1:11', 'name': 'Stack', 'severity': 1},
		); // encounter_events

		roster = {
			"Teuin": {"class": "druid", "spec": "guardian"},
			"Elyrannah": {"class": "dk", "spec": "frost"},
			"Kiroker": {"class": "evoker", "spec": "pres"},
			"Modat": {"class": "monk", "spec": "mw"},
			"Cowshins": {"class": "priest", "spec": "holy"},
			"Zeratek": {"class": "warlock", "spec": "dest"},
			"Dimarco": {"class": "warrior", "spec": "arms"},
			"Oreskovich": {"class": "shaman", "spec": "resto"},
		}; // roster

		actions = new Array(
			// note: for time format use integer seconds. Not MM:SS format.  Later converted to MM:SS for MRT note.
			{'x': '128', 'player': 'Oreskovich', 'spellid': 98008},
			{'x': '128', 'player': 'Kiroker', 'spellid': 370537},
			{'x': '128', 'player': 'Modat', 'spellid': 322118},
			{'x': '208', 'player': 'Cowshins', 'spellid': 64843},
			{'x': '816', 'player': 'Dimarco', 'spellid': 97462},
		); // actions

		// build the encounter data given above
		var encounter_data = {
			'name': last_encounter_name,
			'events': encounter_events,
			'roster': roster,
			'actions': actions,
		}

		// add to list of saved encounters
		saved_encounters.push(last_encounter_name);

		// save this new encounter using our dummy data
		saveEncounter(last_encounter_name, encounter_data);

		// load the encounter, which sets globals: roster, encounter_events, actions
		loadEncounter(last_encounter_name);
	}

	// populate the list of saved encounters
	populateEncounterList(last_encounter_name);



















