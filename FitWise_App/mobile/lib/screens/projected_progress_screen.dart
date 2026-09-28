import 'dart:convert';

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;

import '../main.dart';
import '../theme.dart';

// Progress projections are computed by lib/progress.ts in the Next.js app
// (FitWise_App/web), not reimplemented here -- one source of truth for the
// scenario formula, per the build plan.
class ProjectedProgressScreen extends StatefulWidget {
  const ProjectedProgressScreen({super.key});

  @override
  State<ProjectedProgressScreen> createState() => _ProjectedProgressScreenState();
}

class _ProjectedProgressScreenState extends State<ProjectedProgressScreen> {
  Map<String, dynamic>? _progress;
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final userId = supabase.auth.currentUser!.id;
      final session = supabase.auth.currentSession!;
      // WEB_API_URL is set for the Android emulator (10.0.2.2, which only
      // resolves there); Flutter Web runs as a real browser, so it needs an
      // address the browser can actually reach -- WEB_API_URL_WEB, falling
      // back to localhost since that's where `next dev` runs by default.
      final baseUrl = kIsWeb ? (dotenv.env['WEB_API_URL_WEB'] ?? 'http://localhost:3002') : dotenv.env['WEB_API_URL'];
      final response = await http.get(
        Uri.parse('$baseUrl/api/members/$userId/progress'),
        headers: {'Authorization': 'Bearer ${session.accessToken}'},
      );
      final body = jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode != 200) {
        setState(() => _error = body['error']?.toString() ?? 'Request failed (${response.statusCode})');
        return;
      }
      setState(() {
        _progress = body;
        _error = null;
      });
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: FitWiseColors.background,
      appBar: AppBar(title: const Text('Projected Progress')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Padding(padding: const EdgeInsets.all(16), child: Text(_error!)))
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    MobileCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Current measurements', style: TextStyle(fontWeight: FontWeight.w800)),
                          const SizedBox(height: 4),
                          Text(
                            '${_progress!['baselineWeightKg']} kg baseline · ${(((_progress!['adherenceFactor'] as num) * 100).round())}% adherence',
                            style: const TextStyle(color: FitWiseColors.muted, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                    GridView.count(
                      crossAxisCount: 3,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisSpacing: 9,
                      mainAxisSpacing: 9,
                      childAspectRatio: 1.3,
                      children: [
                        MobileMetric(value: '${_progress!['projections']['month1']}', label: '1 month (kg)'),
                        MobileMetric(value: '${_progress!['projections']['month2']}', label: '2 months (kg)'),
                        MobileMetric(value: '${_progress!['projections']['month3']}', label: '3 months (kg)'),
                      ],
                    ),
                    WarningBanner(_progress!['disclaimer'] as String),
                  ],
                ),
    );
  }
}
