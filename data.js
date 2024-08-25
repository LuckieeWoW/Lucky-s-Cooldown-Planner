	// read class colors
	var class_colors = {}
	const classes = new Array('dk','dh','druid','evoker','hunter','mage','monk','paladin','priest','rogue','shaman','warlock','warrior');
	classes.forEach((item, i) => {
		// read the CSS variable for this class color
		var rgb = getComputedStyle(document.documentElement).getPropertyValue('--color-'+ item)
		// remove the leading "#" and add class_colors object with class name as key
		class_colors[item] = rgb.replace('#','');
	});

	// make list of applicable specs for each class.
	var class_specs = {
		// TO DO: fill in the rest, if needed
		'druid': ['balance', 'feral', 'guardian', 'resto'],
		'evoker': ['aug', 'dev', 'pres'],
		'monk': ['bm', 'mw', 'ww'],
		'paladin': ['holy', 'prot', 'ret'],
		'priest': ['disc', 'holy', 'shadow'],
		'shaman': ['ele', 'enh', 'resto'],
		'rogue': [],
		'mage': [],
		'hunter': [],
	}



	// load spellId table, by class
	//
	// format of spell IDs is either:
	//	spellid (numeric)
	//	OR
	//	spellid-duration (numeric spellid + hyphen + duration in seconds)
	//
	//	Use spellid-duration format to distinguish 2min vs 3min Tranquility, for example.
	//	The "-duration" part of the spellid will be removed in generated MRT note.
	//
	const spells = {


		// DH
		"196718": {"name": "Darkness", "cooldown": 180, "class": "dh", "spec": "", "type": "Damage Reduction"},
		"196555": {"name": "Netherwalk", "cooldown": 180, "class": "dh", "spec": "", "type": "Immunity"},

		// DK
		"51052": {"name": "Anti-Magic Zone", "cooldown": 120, "class": "dk", "spec": "", "type": "Damage Reduction"},
		"49576": {"name": "Death Grip", "cooldown": 120, "class": "dk", "spec": "", "type": "Utility"},
		"108199": {"name": "Gorefiend's Grasp", "cooldown": 120, "class": "dk", "spec": "", "type": "Utility"},
		"315443": {"name": "Abomination Limb", "cooldown": 120, "class": "dk", "spec": "", "type": "Utility"},

		// druid
		"740-120": {"name": "Tranquility 2m", "cooldown": 120, "class": "druid", "spec": "resto", "type": "Major CDs", "exclusivewith": ["740-180"]},
		"740-180": {"name": "Tranquility 3m", "cooldown": 180, "class": "druid", "spec": "resto", "type": "Major CDs", "exclusivewith": ["740-120"]},
		"33891-180": {"name": "Incarnation: Tree of Life 3m", "cooldown": 180, "class": "druid", "spec": "resto", "type": "Major CDs", "exclusivewith": ["33891-120", "323764-120", "323764-60"]},
		"33891-120": {"name": "Incarnation: Tree of Life ~2m", "cooldown": 120, "class": "druid", "spec": "resto", "type": "Major CDs", "shortenable": true, "exclusivewith": ["33891-180", "323764-120", "323764-60"]},
		"323764-120": {"name": "Convoke the Spirits 2m", "cooldown": 120, "class": "druid", "spec": "resto", "type": "Major CDs", "exclusivewith": ["33891-180", "33891-120", "323764-60"]},	/* arguably only care about Convoke for resto */
		"323764-60": {"name": "Convoke the Spirits 1m", "cooldown": 60, "class": "druid", "spec": "resto", "type": "Major CDs", "exclusivewith": ["33891-180", "33891-120", "323764-120"]},	/* arguably only care about Convoke for resto */
		"197721": {"name": "Flourish", "cooldown": 90, "class": "druid", "spec": "resto", "type": "Major CDs"},
		"124974": {"name": "Nature's Vigil", "cooldown": 90, "class": "druid", "spec": "", "type": "Minor CDs"},
		"319454": {"name": "Heart of the Wild", "cooldown": 300, "class": "druid", "spec": "", "type": "Minor CDs"},
		"77764-60": {"name": "Stampeding Roar 1m", "cooldown": 60, "class": "druid", "spec": "", "type": "Mobility", "exclusivewith": ["77764-120"]},
		"77764-120": {"name": "Stampeding Roar 2m", "cooldown": 60, "class": "druid", "spec": "", "type": "Mobility", "exclusivewith": ["77764-60"]},

		// evoker
		"359816": {"name": "Dream Flight", "cooldown": 120, "class": "evoker", "spec": "pres", "type": "Major CDs"},
		"363534-180": {"name": "Rewind 3m", "cooldown": 180, "class": "evoker", "spec": "pres", "type": "Major CDs", "exclusivewith": ["363534-240"]},
		"363534-240": {"name": "Rewind 4m", "cooldown": 240, "class": "evoker", "spec": "pres", "type": "Major CDs", "exclusivewith": ["363534-180"]},
		"370984": {"name": "Emerald Communion", "cooldown": 180, "class": "evoker", "spec": "pres", "type": "Major CDs"},
		"373270": {"name": "Lifebind", "cooldown": 180, "class": "evoker", "spec": "", "type": "Minor CDs"},
		"370537": {"name": "Stasis", "cooldown": 90, "class": "evoker", "spec": "pres", "type": "Minor CDs"},
		"403631": {"name": "Breath of Eons", "cooldown": 120, "class": "evoker", "spec": "", "type": "Minor CDs"},
		"408233": {"name": "Bestow Weyrnstone", "cooldown": 120, "class": "evoker", "spec": "", "type": "Utility"},
		"404977": {"name": "Time Skip", "cooldown": 180, "class": "evoker", "spec": "aug", "type": "Utility"},
		"374227": {"name": "Zephyr", "cooldown": 120, "class": "evoker", "spec": "", "type": "Utility"},
		"374968": {"name": "Time Spiral", "cooldown": 120, "class": "evoker", "spec": "", "type": "Mobility"},
		"370665": {"name": "Rescue", "cooldown": 60, "class": "evoker", "spec": "", "type": "Solo Mobility"},

		// hunter
		"186265": {"name": "Aspect of the Turtle", "cooldown": 180, "class": "hunter", "spec": "", "type": "Immunity"},
		// "390386": {"name": "Fury Of The Aspects", "cooldown": 600, "class": "hunter", "spec": "", "type": ""},

		// mage
		"45438": {"name": "Ice Block", "cooldown": 180, "class": "mage", "spec": "", "type": "Immunity"},
		// "80353": {"name": "Timewarp", "cooldown": 600, "class": "mage", "spec": "", "type": ""},

		// monk
		"115310": {"name": "Revival", "cooldown": 150, "class": "monk", "spec": "mw", "type": "Major CDs"},
		"322118-60": {"name": "Invoke Yu'lon 1m", "cooldown": 60, "class": "monk", "spec": "mw", "type": "Major CDs", "exclusivewith": ["322118-150", "325197-60", "325197-150"]},
		"322118-150": {"name": "Invoke Yu'lon ~3m", "cooldown": 150, "class": "monk", "spec": "mw", "type": "Major CDs", "exclusivewith": ["322118-60", "325197-60", "325197-150"]},
		"325197-60": {"name": "Invoke Chi-Ji 1m", "cooldown": 60, "class": "monk", "spec": "mw", "type": "Major CDs", "exclusivewith": ["322118-60", "322118-150", "325197-150"]},
		"325197-150": {"name": "Invoke Chi-Ji ~3m", "cooldown": 150, "class": "monk", "spec": "mw", "type": "Major CDs", "exclusivewith": ["322118-60", "322118-150", "325197-60"]},
		"116841": {"name": "Tiger's Lust", "cooldown": 180, "class": "monk", "spec": "", "type": "Solo Mobility"},

		// paladin
		"31884": {"name": "Avenging Wrath", "cooldown": 120, "class": "paladin", "spec": "holy", "type": "Major CDs"},
		"414170": {"name": "Daybreak", "cooldown": 60, "class": "paladin", "spec": "holy", "type": "Major CDs"},
		"304971": {"name": "Divine Toll", "cooldown": 60, "class": "paladin", "spec": "holy", "type": "Minor CDs"},
		"114158": {"name": "Lights Hammer", "cooldown": 94, "class": "paladin", "spec": "holy", "type": "Minor CDs"},
		"200652": {"name": "Tyr's Deliverance", "cooldown": 90, "class": "paladin", "spec": "holy", "type": "Minor CDs"},
		"105809": {"name": "Holy Avenger", "cooldown": 180, "class": "paladin", "spec": "holy", "type": "Minor CDs"},
		"31821": {"name": "Aura Mastery", "cooldown": 180, "class": "paladin", "spec": "holy", "type": "Damage Reduction"},
		"642": {"name": "Divine Shield", "cooldown": 180, "class": "paladin", "spec": "", "type": "Immunity"},
		"1044": {"name": "Blessing of Freedom", "cooldown": 25, "class": "paladin", "spec": "", "type": "Solo Mobility"},

		// priest
		"246287": {"name": "Evangelism", "cooldown": 90, "class": "priest", "spec": "disc", "type": "Major CDs"},
		"200183": {"name": "Apotheosis", "cooldown": 120, "class": "priest", "spec": "holy", "type": "Major CDs"},
		"265202": {"name": "Holy Word: Salvation", "cooldown": 165, "class": "priest", "spec": "holy", "type": "Major CDs", "shortenable": true},
		"64843": {"name": "Divine Hymn", "cooldown": 180, "class": "priest", "spec": "holy", "type": "Major CDs"},
		// "200174": {"name": "Mindbender", "cooldown": 60, "class": "priest", "spec": "", "type": "Minor CDs"},
		// "34433": {"name": "Shadowfiend", "cooldown": 180, "class": "priest", "spec": "", "type": "Minor CDs"},
		"47536": {"name": "Rapture", "cooldown": 90, "class": "priest", "spec": "disc", "type": "Minor CDs"},
		"207948": {"name": "Light's Wrath", "cooldown": 90, "class": "priest", "spec": "", "type": "Minor CDs"},
		"62618": {"name": "Power Word: Barrier", "cooldown": 180, "class": "priest", "spec": "disc", "type": "Damage Reduction"},
		"72734": {"name": "Mass Dispel", "cooldown": 45, "class": "priest", "spec": "", "type": "Utility"},
		"64901": {"name": "Symbol of Hope", "cooldown": 180, "class": "priest", "spec": "holy", "type": "Utility"},
		"73325": {"name": "Leap of Faith", "cooldown": 90, "class": "priest", "spec": "", "type": "Solo Mobility"},
		// (passive with mindbender/shadowfiend) "314867": {"name": "Shadow Covenant", "cooldown": 30, "class": "priest", "spec": "disc", "type": ""},
		// "194509": {"name": "Radiance 15s", "cooldown": 15, "class": "priest", "spec": "disc", "type": ""},
		// "194509": {"name": "Radiance 20s", "cooldown": 20, "class": "priest", "spec": "disc", "type": ""},

		// rogue
		"31224": {"name": "Cloak of Shadows", "cooldown": 180, "class": "rogue", "spec": "", "type": "Immunity"},

		// shaman
		"108280": {"name": "Healing Tide Totem", "cooldown": 180, "class": "shaman", "spec": "resto", "type": "Major CDs"},
		"98008": {"name": "Spirit Link Totem", "cooldown": 180, "class": "shaman", "spec": "resto", "type": "Major CDs"},
		"114049": {"name": "Ascendance", "cooldown": 180, "class": "shaman", "spec": "resto", "type": "Major CDs"},
		"108281": {"name": "Ancestral Guidance", "cooldown": 120, "class": "shaman", "spec": "resto", "type": "Minor CDs"},
		"16191": {"name": "Mana Tide Totem", "cooldown": 180, "class": "shaman", "spec": "resto", "type": "Minor CDs"},
		"157153": {"name": "Cloudburst Totem", "cooldown": 45, "class": "shaman", "spec": "", "type": "Minor CDs"},
		"79206": {"name": "Spiritwalker's Grace", "cooldown": 120, "class": "shaman", "spec": "", "type": "Utility"},
		"207399": {"name": "Ancestral Protection Totem", "cooldown": 300, "class": "shaman", "spec": "", "type": "Utility"},
		"192077": {"name": "Wind Rush Totem", "cooldown": 120, "class": "shaman", "spec": "", "type": "Mobility"},

		// warlock
		"111771": {"name": "*Place* Gateway", "cooldown": 90, "class": "warlock", "spec": "", "type": "Mobility"},

		// warrior
		"97462": {"name": "Rallying Cry", "cooldown": 180, "class": "warrior", "spec": "", "type": "Damage Reduction"},





		// general / other
		"2825": {"name": "Bloodlust / Heroism", "cooldown": 600, "class": "", "spec": "", "type": "Major CDs"},

		// note: the override_spellname value will ensure the spell name gets inserted as plain text in the MRT note.  So the text-to-speech option doesn't read out whatever spell is behind the icon we're using for the spellid.
		"111771-0": {"name": "*Use* Gateway", "cooldown": 90, "class": "", "spec": "", "type": "", "override_spellname": true},
		"37414": {"name": "Personals", "cooldown": 60, "class": "", "spec": "", "type": "", "override_spellname": true},
		"441": {"name": "Health Potion", "cooldown": 300, "class": "", "spec": "", "type": "", "override_spellname": true},
		"6262": {"name": "Healthstone", "cooldown": 300, "class": "", "spec": "", "type": "", "override_spellname": true},



	}; // var spells


	// build a list of spells for each class and each type
	var class_spells = {};
	for (var spellid in spells) {

		// for sanity, ensure class, spec are all lowercase
		spells[spellid].class = spells[spellid].class.toLowerCase();
		spells[spellid].spec = spells[spellid].spec.toLowerCase();

		if (typeof class_spells[spells[spellid].class] === 'undefined') {
			class_spells[spells[spellid].class] = new Array();
		}
		Array.prototype.push.call(class_spells[spells[spellid].class], spellid);
	};
	// console.log(spells);
	// console.log(class_spells);
