#!/usr/bin/env python3
"""Give the generated Capacitor Android app two switchable launcher icons.

Usage: python3 patch-android-manifest.py <path/to/AndroidManifest.xml>

What it does (and fails loudly if the manifest is not shaped as expected):
  1. Removes the LAUNCHER intent-filter from MainActivity.
  2. Adds two <activity-alias> launcher entries pointing at MainActivity:
       .WillowIcon  (enabled by default)  -> ic_willow / ic_willow_round
       .TripIcon    (disabled)            -> ic_trip   / ic_trip_round
     The names without the leading dot are what the JS plugin uses.
  3. Points the application-level icon (Settings, recents) at the Willow icon.
"""
import re
import sys

ALIAS = """
        <!-- Switchable launcher icons (see @capawesome/capacitor-app-icon) -->
        <activity-alias
            android:name=".WillowIcon"
            android:enabled="true"
            android:exported="true"
            android:icon="@mipmap/ic_willow"
            android:roundIcon="@mipmap/ic_willow_round"
            android:label="@string/app_name"
            android:targetActivity=".MainActivity">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity-alias>

        <activity-alias
            android:name=".TripIcon"
            android:enabled="false"
            android:exported="true"
            android:icon="@mipmap/ic_trip"
            android:roundIcon="@mipmap/ic_trip_round"
            android:label="@string/app_name"
            android:targetActivity=".MainActivity">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity-alias>
"""

LAUNCHER_FILTER = re.compile(
    r'[ \t]*<intent-filter>\s*'
    r'<action android:name="android\.intent\.action\.MAIN"\s*/>\s*'
    r'<category android:name="android\.intent\.category\.LAUNCHER"\s*/>\s*'
    r'</intent-filter>[ \t]*\n?'
)


def main():
    path = sys.argv[1]
    with open(path, encoding="utf-8") as f:
        xml = f.read()

    if "WillowIcon" in xml:
        sys.exit("manifest already patched")

    xml, n = LAUNCHER_FILTER.subn("", xml)
    if n != 1:
        sys.exit(f"expected exactly 1 launcher intent-filter, found {n}")

    for attr, new in (("icon", "ic_willow"), ("roundIcon", "ic_willow_round")):
        old = f'android:{attr}="@mipmap/ic_launcher{"_round" if attr == "roundIcon" else ""}"'
        if xml.count(old) != 1:
            sys.exit(f"expected exactly 1 {old}")
        xml = xml.replace(old, f'android:{attr}="@mipmap/{new}"')

    if xml.count("</application>") != 1:
        sys.exit("expected exactly 1 </application>")
    xml = xml.replace("</application>", ALIAS + "    </application>")

    with open(path, "w", encoding="utf-8") as f:
        f.write(xml)
    print("patched", path)


if __name__ == "__main__":
    main()
