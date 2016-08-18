package data.mpesa.murani.com.mympesadata;

import android.content.ContentResolver;
import android.database.Cursor;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.TextView;

import org.json.JSONArray;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Arrays;

public class MainActivity extends AppCompatActivity {

    JSONArray jsonArray;

    TextView noOfMPESATexts;
    EditText uniqueID;
    Button sendTexts;
    ProgressBar syncProgress;
    TextView syncStatus;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        noOfMPESATexts = (TextView) findViewById(R.id.no_of_mpesa_texts);
        uniqueID = (EditText) findViewById(R.id.unique_code);
        syncProgress = (ProgressBar) findViewById(R.id.sync_progress);
        syncStatus = (TextView) findViewById(R.id.sync_status);

        sendTexts = (Button) findViewById(R.id.send_texts);
        sendTexts.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String URLString = "https://mpesa2data.herokuapp.com/mpesa_data/" + uniqueID.getText().toString();
                Uri.Builder builder = new Uri.Builder().appendQueryParameter("mpesa_texts", jsonArray.toString());

                new AsyncTask<Object, Void, String>() {
                    protected void onPreExecute() {
                        sendTexts.setEnabled(false);
                        syncProgress.setVisibility(View.VISIBLE);
                        syncStatus.setText("Syncing your messages.");
                    }

                    protected String doInBackground(Object... objects) {
                        return syncMessages((String) objects[0], (Uri.Builder) objects[1]);
                    }

                    protected void onPostExecute(String result) {
                        sendTexts.setEnabled(true);
                        syncProgress.setVisibility(View.GONE);
                        if (result.matches( uniqueID.getText().toString() )) {
                            syncStatus.setText("All done :-). Feel free to leave the app now ...");
                        } else {
                            syncStatus.setText("There was an issue syncing your messages :-(. Please ensure the unique code is corrent and try again.");
                        }
                    }
                }.execute(URLString, builder);
            }
        });

//        Let us begin ...
        String[] messages = getMPESATexts();
        jsonArray = new JSONArray(Arrays.asList(messages));
        noOfMPESATexts.setText(String.valueOf(messages.length));
    }

    protected String[] getMPESATexts() {
        Uri smsInboxUri = Uri.parse("content://sms/inbox");
        String[] smsColumns = {"_id", "body", "address"};
        ContentResolver contentResolver = getContentResolver();
        Cursor cursor = contentResolver.query
                (smsInboxUri, smsColumns, "address='MPESA'", null, null);
        String[] messages = new String[cursor.getCount()];
        for (int i = 0; i < cursor.getCount(); i++) {
            cursor.moveToPosition(i);
            int index = cursor.getColumnIndex("body");
            messages[i] = cursor.getString(index);
        }
        return messages;
    }

    protected String syncMessages(String URLString, Uri.Builder builder) {
        String result = "null";
        try {
            URL url = new URL(URLString);
            HttpURLConnection httpURLConnection = (HttpURLConnection) url.openConnection();
            httpURLConnection.setRequestMethod("POST");
            httpURLConnection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
            httpURLConnection.setDoInput(true);
            httpURLConnection.setDoOutput(true);
            String query = builder.build().getEncodedQuery();
            OutputStream outputStream = httpURLConnection.getOutputStream();
            OutputStreamWriter outputStreamWriter = new OutputStreamWriter(outputStream, "UTF-8");
            BufferedWriter bufferedWriter = new BufferedWriter(outputStreamWriter);
            bufferedWriter.write(query);
            bufferedWriter.flush();
            bufferedWriter.close();
            outputStream.close();

            InputStream inputStream = httpURLConnection.getInputStream();
            InputStreamReader inputStreamReader = new InputStreamReader(inputStream);
            BufferedReader bufferedReader = new BufferedReader(inputStreamReader);
            StringBuilder stringBuilder = new StringBuilder();
            do {
                stringBuilder.append(bufferedReader.readLine());
            } while (bufferedReader.readLine() != null);
            inputStream.close();
            httpURLConnection.disconnect();
            result = stringBuilder.toString();
        } catch (MalformedURLException e) {
            Log.i("HIR", e.getMessage());
        } catch (IOException e) {
            Log.i("HIR", e.toString());
        } catch (Exception e) {
            e.printStackTrace();
        }
        return result;
    }
}
